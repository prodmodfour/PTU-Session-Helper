---
cap_id: capture-C053
name: Pokemon.ownerId
type: prisma-field
domain: capture
---

### capture-C053: Pokemon.ownerId
- **cap_id**: capture-C053
- **name**: Pokemon Owner ID Field
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma` -- Pokemon.ownerId (nullable FK to HumanCharacter)
- **game_concept**: PTU: ownership tracking (wild vs. owned Pokemon)
- **description**: Nullable foreign key linking Pokemon to their trainer (HumanCharacter). Set to trainerId on successful capture. Null means wild/unowned. The capture attempt API validates that ownerId is null before allowing capture (cannot capture an owned Pokemon).
- **inputs**: Set during capture (trainerId)
- **outputs**: Used for ownership checks, party management
- **accessible_from**: gm (managed through capture flow and character management)
