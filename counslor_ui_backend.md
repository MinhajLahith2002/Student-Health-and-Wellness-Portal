# Counseling Module Backend & Integration Blueprint

## 1. Backend Overview

### Architecture style
- REST API over Express.
- MVC-like split:
  - routes: auth/role/permission guards
  - controllers: validation + HTTP response formatting
  - services: business logic + serialization + side effects
  - models: Mongoose entities

### Core backend files
- `server/src/routes/counseling.routes.js`
- `server/src/controllers/counseling.controller.js`
- `server/src/services/counseling.service.js`

### Key implementation rule
This module is slot-driven:
- counselor creates open slot first
- student books that slot
- the same record then becomes a booked counseling session

## 2. Data Models / Entities

### User
- Relevant fields:
  - `_id`
  - `fullName`
  - `email`
  - `role`
  - `status`
- Used for both students and counselors.

### CounselorProfile
- Fields:
  - `userId`
  - `department`
  - `specialization`
  - `phone`
  - `bio`
  - `focusAreas`
  - `sessionModes`
  - `reminderLeadMinutes`
- Relationship:
  - one-to-one with counselor `User`

### CounselingSession
- Dual-purpose entity for:
  - open slot inventory
  - booked counseling session
- Fields:
  - `studentId` nullable
  - `counselorId`
  - `scheduledAt`
  - `endsAt`
  - `sessionMode`
  - `urgencyLevel`
  - `concernSummary`
  - `privateContext`
  - `status`
  - `meetingLink`
  - `summaryTemplate`
  - `studentVisibleSummary`
  - `reminderReady`
  - `assignedResources`
  - `feedbackSubmitted`
- Status enum:
  - `available`
  - `scheduled`
  - `checked_in`
  - `in_session`
  - `completed`
  - `cancelled`

### CounselorNote
- Fields:
  - `sessionId`
  - `studentId`
  - `counselorId`
  - `privateNotes`
  - `actionItems`
  - `riskLevel`
  - `recommendedResources`
- One logical note per session, implemented as create-or-update.

### Feedback
- Counseling use:
  - `sessionId`
  - `studentId`
  - `counselorId`
  - `feedbackType = counselor`
  - `rating`
  - `reviewText`

### Resource
- Owned by shared content system, but counseling consumes it for:
  - counselor resource browsing
  - session follow-up recommendations
  - note recommended resources

### Notification
- Owned by shared notification system.
- Counseling module creates student notifications for booking and session changes.

## 3. APIs / Endpoints

All routes live under `/api/counseling`.

### Student discovery
- `GET /counselors`
  - Query: `search`, `name`, `specialization`, `department`, `focusArea`
  - Returns counselor cards with rating and availability summary.
- `GET /counselors/:counselorId`
  - Returns counselor profile plus available slots.
- `GET /counselors/:counselorId/slots`
  - Student + `counseling.book`
  - Returns all future available slots.
- `GET /counselors/:counselorId/feedback`
  - Returns counselor feedback aggregate and recent feedback list.

### Student booking and session management
- `POST /sessions`
  - Student + `counseling.book`
  - Books an existing slot.
  - Body:
    - `sessionId`
    - `urgencyLevel`
    - `concernSummary`
    - `privateContext`
- `GET /sessions/student`
  - Query:
    - `status`
    - `dateScope`
    - `dateSort`
- `GET /sessions/:sessionId`
  - Student or counselor
  - Returns role-shaped session detail.
- `PATCH /sessions/:sessionId/student`
  - Body: `{ action: "check_in" | "cancel" }`
- `PATCH /sessions/:sessionId/student-booking`
  - Student + `counseling.book`
  - Updates urgency, concern summary, private context.
- `DELETE /sessions/:sessionId/student-booking`
  - Student + `counseling.book`
  - Removes booking and reopens slot.
- `POST /sessions/:sessionId/feedback`
  - Student only
  - Body:
    - `rating`
    - `reviewText`

### Counselor slot and session operations
- `GET /sessions/counselor`
  - Counselor + `sessions.manage`
  - Returns both open slots and booked sessions for that counselor.
- `POST /sessions/counselor`
  - Counselor + `sessions.manage`
  - Creates open slot.
  - Body:
    - `scheduledAt`
    - `endsAt`
    - `sessionMode`
- `PATCH /sessions/:sessionId/counselor-slot`
  - Counselor + `sessions.manage`
  - Updates open unbooked slot only.
- `DELETE /sessions/:sessionId/counselor-slot`
  - Counselor + `sessions.manage`
  - Deletes open unbooked slot only.
- `PATCH /sessions/:sessionId/counselor`
  - Counselor + `sessions.manage`
  - Updates:
    - `status`
    - `summaryTemplate`
    - `studentVisibleSummary`
    - `assignedResources`
- `POST /sessions/:sessionId/notes`
  - Counselor + `notes.manage`
  - Saves counselor note.
- `GET /notes`
  - Counselor + `notes.manage`
  - Lists counselor notes.

### Counselor profile
- `GET /profile/me`
- `PUT /profile/me`
  - Body:
    - `bio`
    - `focusAreas`
    - `sessionModes`
    - `reminderLeadMinutes`

### Adjacent mental-health endpoints
- `GET /mood`
- `POST /mood`
- `GET /mood/insights`
- `GET /suggestions`
- `GET /suggestions/history`
- These are adjacent, not required for the core counselor-slot booking workflow.

## 4. Business Logic

### Counselor directory/profile assembly
- Service combines:
  - active counselor user
  - counselor profile
  - feedback average/count
  - count of future `available` slots
  - next future slot time

### Slot creation
- Counselor creates an open slot.
- Constraints:
  - future only
  - end after start
  - no overlap with counselor’s `available`, `scheduled`, `checked_in`, or `in_session` sessions
  - session mode must be enabled in counselor profile
- New slot defaults:
  - `studentId = null`
  - `status = available`
  - `urgencyLevel = routine`
  - empty concern/private context
  - generated `meetingLink` for remote modes

### Slot update
- Allowed only if:
  - slot belongs to counselor
  - slot is still `available`
  - `studentId` is null
- Re-runs overlap and mode checks.

### Slot delete
- Allowed only for open unbooked `available` slot.
- Deletes the record.

### Student booking
- Student books one existing slot.
- Constraints:
  - student account exists and is active
  - slot still exists and is `available`
  - slot start time is still in future
  - student has no overlapping counseling session in active states
- Side effects:
  - fills `studentId`
  - fills concern/urgency/private context
  - changes status to `scheduled`
  - ensures remote meeting link exists
  - creates student notification

### Student check-in / cancel
- `check_in` sets status to `checked_in`.
- `cancel` sets status to `cancelled`.
- Student receives notification for the change.

### Student booking update
- Allowed only while:
  - status is `scheduled` or `checked_in`
  - session has not ended yet
- Updates urgency, concern summary, private context.

### Student booking delete
- Allowed only while:
  - status is `scheduled` or `checked_in`
  - session is still upcoming
- Does not destroy the session record.
- Resets record back to reusable slot:
  - `studentId = null`
  - default urgency
  - empty concern/private context
  - `status = available`
  - clears summaries/resources/feedback flag
- Deletes linked counselor notes.

### Counselor session update
- Counselor updates session status and follow-up data.
- Student notification is sent when:
  - session becomes `in_session`
  - session becomes `completed`
  - session becomes `cancelled`
  - follow-up summary/resources are newly added after completion

### Counselor notes
- Note endpoint upserts one note per session.
- Note stays counselor-only.
- Note list is enriched with student and session context.

### Feedback
- Feedback allowed only after `completed`.
- Only one feedback record per session.
- Session sets `feedbackSubmitted = true`.
- Feedback contributes to counselor ratings shown in directory/profile.

### Live-room link behavior
- In-person sessions return no meeting link.
- Remote sessions return generated join links or preserved valid links.
- Student and counselor use the same link.

## 5. State Transitions

```text
available
  -> scheduled      (student books slot)
  -> deleted        (counselor removes slot)

scheduled
  -> checked_in     (student checks in)
  -> cancelled      (student or counselor cancels)
  -> available      (student deletes booking)

checked_in
  -> in_session     (counselor starts live session)
  -> cancelled      (student or counselor cancels)
  -> available      (student deletes booking while still eligible)

in_session
  -> completed      (counselor completes)
  -> cancelled      (counselor cancels)

completed
  -> feedbackSubmitted = true after student feedback
```

## 6. Authentication & Authorization

### Role access
- Student-only:
  - counselor directory/profile
  - slot listing
  - booking create/update/delete
  - student sessions
  - feedback
- Counselor-only:
  - counselor sessions list
  - slot create/update/delete
  - notes list/save
  - profile read/update

### Permission checks
- Student booking endpoints also require `counseling.book`.
- Counselor slot/session endpoints require `sessions.manage`.
- Counselor note endpoints require `notes.manage`.

### Detail-route ownership
- Student can access only sessions where `studentId == current user`.
- Counselor can access only sessions where `counselorId == current user`.

### Field-level visibility
- Students do not receive:
  - counselor `privateContext`
  - `summaryTemplate`
  - note object
- Counselors do receive those fields.

## 7. Validation Rules

### Booking create/update
- `sessionId` valid ObjectId
- `concernSummary` required, max 1500
- `urgencyLevel` one of `routine | priority | urgent | crisis`
- `privateContext` max 2000

### Counselor slot create/update
- valid `scheduledAt`
- valid `endsAt`
- `endsAt > scheduledAt`
- `sessionMode` one of `video | chat | in_person`
- future-only
- no overlap
- mode must be enabled in counselor profile

### Counselor session update
- `status` one of `checked_in | in_session | completed | cancelled`
- `summaryTemplate` max 1800
- `studentVisibleSummary` max 1800
- if completed, student summary must be at least 12 chars
- `assignedResources` max 2

### Counselor note
- `privateNotes` required, max 2500
- `actionItems` max 10
- each action item 2 to 80 chars
- no duplicate action items
- `riskLevel` one of `low | medium | high | critical`
- `recommendedResources` max 2

### Counselor profile
- `bio` max 1200, min 20 if present
- `focusAreas`
  - max 12
  - each 2 to 60 chars
  - must include letters
  - allowed punctuation only
  - no duplicates
- `sessionModes` at least one valid mode
- `reminderLeadMinutes` integer 15 to 1440

### Feedback
- `rating` integer 1 to 5

## 8. Error Handling

### Common error cases
- invalid IDs -> `422`
- missing profile/session/slot -> `404`
- booking unavailable slot -> `404` or `409`
- past-slot booking attempt -> `409`
- overlap conflict -> `409`
- updating/removing booked slot -> `409`
- updating/deleting past booking -> `409`
- feedback before completion -> `409`
- duplicate feedback -> `409`

### Expected error shape
```json
{
  "success": false,
  "message": "Validation failed.",
  "fields": {
    "concernSummary": "Concern summary is required."
  }
}
```

Frontend relies on:
- `message` for banners
- `fields` for per-input errors

## 9. UI ↔ Backend Mapping

### Student Counselor Directory
- API: `GET /counselors`
- Data used: counselor summary, rating, open-slot count, next slot

### Student Counselor Profile
- APIs:
  - `GET /counselors/:counselorId`
  - `GET /counselors/:counselorId/feedback`

### Student Book Counseling
- APIs:
  - `GET /counselors`
  - `GET /counselors/:counselorId/slots`
  - `POST /sessions`
- Client side also removes booked slot from cached availability views.

### Student My Sessions
- APIs:
  - `GET /sessions/student`
  - `PATCH /sessions/:sessionId/student-booking`
  - `DELETE /sessions/:sessionId/student-booking`

### Student Session Room
- APIs:
  - `GET /sessions/:sessionId`
  - `PATCH /sessions/:sessionId/student`
  - `PATCH /sessions/:sessionId/student-booking`
  - `DELETE /sessions/:sessionId/student-booking`

### Student Feedback
- API: `POST /sessions/:sessionId/feedback`

### Counselor Dashboard
- APIs:
  - `GET /sessions/counselor`
  - `GET /notes`

### Counselor Sessions Workspace
- APIs:
  - `GET /sessions/counselor`
  - `POST /sessions/counselor`
  - `PATCH /sessions/:sessionId/counselor-slot`
  - `DELETE /sessions/:sessionId/counselor-slot`

### Counselor Session Room
- APIs:
  - `GET /sessions/:sessionId`
  - `PATCH /sessions/:sessionId/counselor`
  - `POST /sessions/:sessionId/notes`
  - shared resource-list API from content module

### Counselor Notes
- API: `GET /notes`

### Counselor Profile Settings
- APIs:
  - `GET /profile/me`
  - `PUT /profile/me`

### Counselor Notifications
- Uses shared notification APIs, not counseling-owned routes.

## 10. Existing Backend Analysis

### KEEP
- controller/service split
- single `CounselingSession` model for slot + booked session
- role and permission guards
- structured `ApiError` field responses
- overlap checks
- booking delete -> slot reopens
- notification side effects
- role-shaped `enrichSession` serializer
- feedback aggregation reused in counselor discovery

### MODIFY
- `server/src/services/counseling.service.js`
  - behavior is solid, but it mixes core counseling with mood/suggestions logic; split by domain when porting.
- `server/src/controllers/counseling.controller.js`
  - move inline validators to dedicated schema/validator modules.
- resource assignment
  - keep shared resource dependency, but define clearer DTOs if the new stack supports them.

### REMOVE
- any workflow where student invents a new session instead of booking an existing slot
- any counselor-create flow that requires selecting a student first
- placeholder live-room URLs that are not valid join routes

### REPLACE
- replace ad-hoc invalidation with formal query invalidation if the new client stack supports it
- replace inline validators with schema middleware if available
- replace large service file with smaller feature services

## 11. Final Backend Implementation Plan

### Must be rebuilt
- `CounselorProfile`
- `CounselingSession`
- `CounselorNote`
- counselor directory/profile queries
- counselor slot create/update/delete
- student booking create/update/delete
- student check-in/cancel
- counselor session update
- counselor note upsert/list
- feedback submit/list aggregate
- remote meeting-link generation
- student notifications for counseling events

### Can be reused
- REST route naming
- permission model:
  - `counseling.book`
  - `sessions.manage`
  - `notes.manage`
- state machine
- validation limits
- overlap logic
- shared content and notification modules

### Must be removed
- any competing flow that bypasses counselor-created slot inventory

### Recommended rebuild order
1. Build models.
2. Build serializers and overlap helpers.
3. Build discovery/profile endpoints.
4. Build slot create/update/delete.
5. Build student booking/list/detail/update/delete.
6. Build counselor session update + notes.
7. Build feedback.
8. Add notifications and meeting links.
9. Verify end to end:
   - counselor creates slot
   - student sees slot
   - student books slot
   - student updates booking
   - counselor sees updated booking
   - student deletes booking
   - slot becomes available again
   - counselor completes session
   - student submits feedback

## 12. Existing Project Adaptation Rules

Use this section when the target backend already exists and the goal is to integrate the counseling module into that architecture rather than mirror this repository’s exact folder layout.

### Adaptation strategy
- Treat this file as a behavior and contract blueprint, not a demand to copy the same filenames.
- Preserve the target backend’s architecture style if it can represent the same counseling lifecycle.
- Reuse existing auth, notification, resource, and user modules where possible.

### Service/module mapping rules
- If the target project already separates features more cleanly, map the counseling logic into those existing service boundaries.
- Do not force everything into one `counseling.service` file if the target codebase prefers:
  - controllers
  - use-cases
  - repositories
  - command/query handlers
  - domain services
- Keep the same business rules even if the module boundaries change.

### Data-model adaptation rules
- If the target project already has:
  - user model
  - staff profile model
  - feedback model
  - notifications
  - resources/content
  then extend those instead of duplicating them.
- Only create new tables/collections/models for concepts that do not already exist, especially:
  - counseling session / slot inventory
  - counselor note
  - counselor-specific profile fields if not already present

### API adaptation rules
- Keep the same logical endpoint capabilities even if the target project uses:
  - a different route prefix
  - nested routes
  - GraphQL
  - RPC
  - server actions
- The exact transport can change, but these operations must still exist:
  - list counselors
  - get counselor profile
  - list available slots
  - create/update/delete slot
  - book slot
  - list student sessions
  - get session detail
  - update/delete student booking
  - update counselor session
  - save/list counselor notes
  - submit/list feedback
  - get/update counselor profile settings

### Integration rules
- Reuse the target project’s current:
  - authentication middleware
  - role model
  - permission checks
  - audit logging
  - notification dispatching
  - content/resource ownership
- If the target system already has a meeting provider integration, plug counseling sessions into that instead of copying the exact join-link helper.

### What must never be changed during adaptation
- Counselor-created open slot inventory is the source of truth.
- Student booking consumes an existing slot; it does not create an arbitrary new session.
- Student booking delete restores the slot to availability.
- Counselor slot update/delete is limited to unbooked available slots.
- Counselor-private note data stays private from students.
- Student-visible summary is separate from counselor-private notes.
- Feedback is only allowed after completion.

### Verification requirement for adapted projects
After adapting to the target backend, verify the full flow still works:
1. counselor creates slot
2. student sees slot
3. student books slot
4. counselor sees booked session
5. student updates booking
6. counselor sees updated details
7. student deletes booking
8. slot returns to open inventory
9. counselor completes session
10. student sees follow-up summary
11. student submits feedback
