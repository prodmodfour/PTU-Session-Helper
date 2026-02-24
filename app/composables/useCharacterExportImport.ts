/**
 * Composable for character JSON export and import operations.
 * Handles downloading export JSON and uploading import files
 * with conflict detection feedback.
 */

interface ImportConflict {
  entityType: string
  entityId: string
  entityName: string
  field: string
  importValue: unknown
  serverValue: unknown
  resolution: string
}

export interface ImportResult {
  success: boolean
  message: string
  hasConflicts: boolean
  conflicts: ImportConflict[]
}

export function useCharacterExportImport(characterId: Ref<string>, characterName: Ref<string>) {
  const exporting = ref(false)
  const importing = ref(false)
  const importResult = ref<ImportResult | null>(null)

  const importResultClass = computed(() => {
    if (!importResult.value) return ''
    if (!importResult.value.success) return 'import-result--error'
    if (importResult.value.hasConflicts) return 'import-result--warning'
    return 'import-result--success'
  })

  /** Export character data as a downloadable JSON file. */
  const handleExport = async () => {
    exporting.value = true
    try {
      const response = await $fetch<{ success: boolean; data: unknown }>(
        `/api/player/export/${characterId.value}`
      )

      const blob = new Blob(
        [JSON.stringify(response.data, null, 2)],
        { type: 'application/json' }
      )
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${characterName.value.replace(/[^a-zA-Z0-9_-]/g, '_')}_export.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      importResult.value = {
        success: false,
        message: `Export failed: ${err.message || 'Unknown error'}`,
        hasConflicts: false,
        conflicts: []
      }
    } finally {
      exporting.value = false
    }
  }

  /** Process an import file and send to the server. Returns true if fields were updated. */
  const handleImportFile = async (file: File): Promise<boolean> => {
    importing.value = true
    importResult.value = null

    try {
      const text = await file.text()
      let payload: unknown

      try {
        payload = JSON.parse(text)
      } catch {
        importResult.value = {
          success: false,
          message: 'Invalid JSON file. Please select a valid export file.',
          hasConflicts: false,
          conflicts: []
        }
        return false
      }

      const response = await $fetch<{
        success: boolean
        data: {
          fieldsUpdated: number
          hasConflicts: boolean
          conflicts: ImportConflict[]
        }
      }>(`/api/player/import/${characterId.value}`, {
        method: 'POST',
        body: payload
      })

      const { fieldsUpdated, hasConflicts, conflicts } = response.data

      let message: string
      if (fieldsUpdated === 0 && !hasConflicts) {
        message = 'No changes to import. Character is already up to date.'
      } else if (hasConflicts) {
        message = `Imported ${fieldsUpdated} change(s). ${conflicts.length} conflict(s) detected (server version kept).`
      } else {
        message = `Successfully imported ${fieldsUpdated} change(s).`
      }

      importResult.value = {
        success: true,
        message,
        hasConflicts,
        conflicts
      }

      return fieldsUpdated > 0
    } catch (err: any) {
      const serverMessage = err.data?.message || err.message || 'Unknown error'
      importResult.value = {
        success: false,
        message: `Import failed: ${serverMessage}`,
        hasConflicts: false,
        conflicts: []
      }
      return false
    } finally {
      importing.value = false
    }
  }

  const clearImportResult = () => {
    importResult.value = null
  }

  return {
    exporting: readonly(exporting),
    importing: readonly(importing),
    importResult: readonly(importResult),
    importResultClass,
    handleExport,
    handleImportFile,
    clearImportResult
  }
}
