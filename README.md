# GolfSync

A simple application to help golf clubs manage members, track scores, and organize golf events.

## Roadmap

### Phase 1: Foundation

- [X] Set up Clerk for authentication
- [ ] Build out initial UI
- [X] Create database schema for members
- [X] Migrate member data using scripts
- [ ] Build SERVER COMPONENTS for member data
- [ ] Create member management interface
- [ ] Display member data in dashboard

### Phase 2: Core Features

- [ ] TEST
- [ ] TEST
- [ ] TEST
- [ ] TEST

### Phase 3: Stuff ill need to do in future

- [ ] TEST
- [ ] TEST
- [ ] TEST
- [ ] Migrate users using Clerk migrate docs


# Things that need fixing

- [X] Inconsistent member numbering system:
  - Duplicate member numbers exist across active and resigned members
  - Staff members don't have a consistent numbering format
  - Many members have empty or zero member numbers
  - No clear distinction between different member types in numbering
  - No standardized format for handling resigned members

# Recent Fixes

## Member Numbering System Standardization ✅

Fixed inconsistent member numbering system with the following changes:

1. Staff Members (68 total)

   - Added "S-" prefix to all staff member numbers
   - Empty staff numbers standardized to "S-STAFF"

2. Resigned Members (405 total)

   - Added "R-" prefix to all resigned member numbers
   - Empty resigned numbers standardized to "R-RESIGNED"

3. Empty/Zero Numbers (25 total)

   - Standardized all empty or "0" numbers to "EMPTY"

4. Duplicate Numbers Found and Handled:

   - Original duplicates:

     - TM001 (UNLIMITED PLAY MALE)
     - 123456 (FULL PLAY FEMALE)
     - 2774A (UNLIMITED PLAY MALE)
     - TM057 (UNLIMITED PLAY MALE)
     - TM075 (UNLIMITED PLAY MALE)
     - TM002 (UNLIMITED PLAY MALE)
     - TM062 (FULL PLAY MALE)

   - Additional duplicates found during import:
     - 6554 (Ethan Reid - JUNIOR BOY)
     - 8766 (Luca Tomei - JUNIOR BOY)
     - 3665 (Steve Wong - WAITING LIST)
     - 6033 (Sam Hu - UNLIMITED PLAY MALE)
     - 6504 (Cooper Pederson - JUNIOR <10)
     - 6534 (Leonardo Yang - JUNIOR BOY)
     - 6921 (Eric Niu - JUNIOR BOY)

5. CSV Structure Issues Identified:
   - Duplicate columns found:
     - "Member Number" and "memberNumber"
     - "Class" appears twice
   - These duplicates need to be consolidated to prevent import errors

Total Changes:

- Members processed: 1403
- Staff prefixes added: 68
- Resigned prefixes added: 405
- Empty numbers standardized: 25
- Duplicate numbers identified: 14 (7 original + 7 additional)
- Unchanged members: 898