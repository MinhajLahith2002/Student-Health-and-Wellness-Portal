# Counseling Module UI Blueprint

## 1. Overview

### Purpose
This module supports private student-to-counselor care using counselor-created slots. Counselors publish open slots, students discover counselors and book one of those slots, both sides access the same session room or remote-room link, counselors record private notes and student-facing follow-up, and students submit feedback after completion.

### Roles involved
- Student/User: browse counselors, inspect profiles, book open slots, manage their booked sessions, join live sessions, check in, cancel, update/delete bookings, and submit feedback.
- Counselor: maintain student-facing profile settings, create/update/remove open slots, manage booked sessions, run live sessions, save private notes, write student-visible summaries, recommend resources, review notes, browse resources, and review notifications.
- Admin: not part of the core counseling routes, but indirectly supports the module by onboarding counselors, publishing resources, and broadcasting notifications.

### Active frontend implementation
- Student counseling screens are primarily implemented in `client/src/pages/student/counselingPages.jsx`.
- Counselor counseling screens are primarily implemented in `client/src/pages/counselor/portalPages.jsx`.
- Routes load thin wrapper files such as `client/src/pages/student/CounselorDirectory.jsx` and `client/src/pages/counselor/Sessions.jsx`.
- Shared shell: `RoleLayout`.
- Shared UI primitives: cards, loaders, banners, empty states, status pills, and stat cards.
- Shared performance pattern: local cache hydration plus browser event synchronization.

## 2. User Flows

### Student/User counseling flow
1. Student opens `/student/counselors`.
2. Student filters counselors by name, specialization, department, and focus area.
3. Student opens `/student/counselors/:counselorId`.
4. Student reviews bio, focus areas, modes, rating, open slots, and feedback.
5. Student opens `/student/counseling/book/:counselorId` or generic `/student/counseling/book`.
6. Student selects:
   - counselor
   - one existing open slot
   - urgency
   - concern summary
   - optional private context
7. Student submits booking.
8. UI inserts the new session into “My counseling sessions” and removes the slot from counselor availability.
9. Student opens `/student/sessions`.
10. Student can open session room, update booking, or delete booking while the session is still upcoming.
11. Student opens `/student/sessions/:sessionId` to:
   - open meeting link
   - toggle embedded room
   - check in
   - cancel
   - update booking
   - delete booking
   - review student-visible summary
12. After completion, student opens `/student/sessions/:sessionId/feedback` and submits feedback.

### Counselor flow
1. Counselor opens `/counselor/dashboard`.
2. Dashboard shows totals, active sessions, completed sessions, note count, upcoming sessions, and recent notes.
3. Counselor opens `/counselor/profile-settings` and maintains public profile data.
4. Counselor opens `/counselor/sessions`.
5. Counselor creates an open slot with start date/time, duration, and mode.
6. Counselor sees the slot inside the open-slot container.
7. Counselor can filter open slots, update an unbooked slot, remove an unbooked slot, and open the live room for remote sessions.
8. Once a student books a slot, it moves into the booked-session list.
9. Counselor opens `/counselor/sessions/:sessionId`.
10. In session room, counselor can:
    - review student context
    - open or embed the live room
    - update status
    - write internal summary template
    - write student-visible summary
    - write private notes
    - add action items
    - set risk level
    - attach recommended resources
11. Save updates refresh the session room, dashboard, and notes state.

### Optional admin/management flow
- Admin does not manage counseling sessions directly.
- Admin-owned dependencies:
  - counselor account onboarding
  - content publishing for mental-health resources
  - notification broadcasts

## 3. Pages / Screens

### Student: Counselor Directory
- Route: `/student/counselors`
- Purpose: discover counselors before booking.
- Components:
  - counseling layout
  - “Booking flow” explainer card
  - filter form
  - counselor card list
  - loader, empty state, error/refresh banners
- Actions:
  - change filters
  - open profile
  - jump to booking
- Navigation:
  - from mental-health entry points or student nav
  - to counselor profile and booking page

### Student: Counselor Profile
- Route: `/student/counselors/:counselorId`
- Purpose: inspect one counselor in detail.
- Components:
  - stat cards
  - profile overview card
  - scrollable open-slot list
  - feedback list
- Actions:
  - open booking flow
- Navigation:
  - from counselor directory
  - to booking

### Student: Book Counseling
- Routes:
  - `/student/counseling/book`
  - `/student/counseling/book/:counselorId`
- Purpose: book one already-created slot.
- Components:
  - counselor selector
  - slot selector
  - urgency select
  - concern summary textarea
  - private context textarea
  - inline validation
  - selected-slot summary
- Actions:
  - select counselor
  - select slot
  - submit booking
- Navigation:
  - from directory/profile
  - redirects to `/student/sessions`

### Student: My Counseling Sessions
- Route: `/student/sessions`
- Purpose: list current and historical counseling sessions.
- Components:
  - stat cards
  - filter bar
  - session cards
  - inline booking update form
- Actions:
  - filter
  - open session
  - update booking
  - delete booking
- Navigation:
  - from student nav and booking success redirect
  - to session room and feedback

### Student: Counseling Session Room
- Route: `/student/sessions/:sessionId`
- Purpose: live room access plus booking management and follow-up review.
- Components:
  - status stat cards
  - session details card
  - action tray
  - embedded meeting panel
  - booking edit form
- Actions:
  - open meeting
  - show/hide embedded room
  - check in
  - cancel
  - update booking
  - delete booking
  - leave feedback

### Student: Session Feedback
- Route: `/student/sessions/:sessionId/feedback`
- Purpose: capture post-session rating and review.
- Components:
  - rating select
  - review textarea
  - error banner
- Actions:
  - submit feedback

### Counselor: Dashboard
- Route: `/counselor/dashboard`
- Purpose: high-level operational snapshot.
- Components:
  - stat cards
  - upcoming session list
  - recent notes list
- Actions:
  - open session room
  - open live room for remote sessions
  - jump to sessions workspace

### Counselor: Sessions Workspace
- Route: `/counselor/sessions`
- Purpose: create and manage counselor-owned slot inventory and booked sessions.
- Components:
  - create slot form
  - open-slot filters
  - scrollable open-slot container
  - slot cards
  - inline slot update form
  - booked-session list
- Actions:
  - create slot
  - update slot
  - remove slot
  - open live room
  - open session room

### Counselor: Session Room
- Route: `/counselor/sessions/:sessionId`
- Purpose: secure workspace for session operations and notes.
- Components:
  - student context card
  - embedded live-room panel
  - counselor controls form
  - banners for permission-limited state
- Actions:
  - update status
  - update internal summary
  - update student-visible summary
  - save private notes
  - update action items
  - set risk
  - attach resources
  - open/toggle room

### Counselor: Notes
- Route: `/counselor/notes`
- Purpose: read-only history of counselor notes.
- Components:
  - note cards
  - action item chips
  - risk label

### Counselor: Resources
- Route: `/counselor/resources`
- Purpose: browse published mental-health resources for follow-up.
- Components:
  - search box
  - category filter
  - format filter
  - result count
  - resource grid

### Counselor: Notifications
- Route: `/counselor/notifications`
- Purpose: role-targeted private inbox.
- Implementation: shared `PersonalNotificationsPage`.
- Actions:
  - sort
  - mark read
  - open linked action

### Counselor: Profile Settings
- Route: `/counselor/profile-settings`
- Purpose: maintain student-facing counselor profile.
- Components:
  - bio textarea
  - focus areas input
  - session mode preset select
  - reminder lead numeric input
  - live validation
  - success/error banners

## 4. Components

### Shared layout and cards
- `RoleLayout`
  - Purpose: role shell with nav, title, subtitle, optional actions.
  - Data/props: `themeState`, `roleLabel`, `navItems`, `title`, `subtitle`, `actions`.
  - Reusable across roles.
- `StudentCounselingLayout` / `CounselorLayout`
  - Thin counseling wrappers over `RoleLayout`.
- `SurfaceCard`
  - Section wrapper with eyebrow/title/subtitle/action.
- `StatCard`
  - KPI display with `label`, `value`, `hint`, optional `tone`.
- `StatusPill`
  - Renders modes, statuses, focus tags.
- `Loader`
- `EmptyState`
- `NoticeBanner`

### Student-side forms
- Directory filter form
  - Fields: `name`, `specialization`, `department`, `focusArea`.
  - Live validation and normalization.
- Booking form
  - Fields: `counselorId`, `sessionId`, `urgencyLevel`, `concernSummary`, `privateContext`.
  - Must reject unavailable slot selection.
- Booking edit form
  - Fields: `urgencyLevel`, `concernSummary`, `privateContext`.
- Feedback form
  - Fields: `rating`, `reviewText`.

### Counselor-side forms
- Create slot form
  - Fields: `scheduledAt`, `durationMinutes`, `sessionMode`.
- Update slot form
  - Same contract as create slot.
- Session room form
  - Fields: `status`, `summaryTemplate`, `studentVisibleSummary`, `privateNotes`, `actionItems`, `riskLevel`.
- Profile settings form
  - Fields: `bio`, `focusAreas`, `sessionModes`, `reminderLeadMinutes`.

### List/card components
- Counselor card
  - Needs name, specialization, department, bio, focus areas, modes, average rating, review count, slot count, next slot.
- Available slot card
  - Needs scheduled time, mode, booking state.
- Session card
  - Needs counselor, schedule, mode, status, concern summary, feedback state.
- Note card
  - Needs student, session metadata, risk, notes, action items.
- Resource card
  - Needs title, type, summary, slug.
- Notification card
  - Needs title, message, type, createdAt, readAt, actionUrl.

### Reusable interaction pieces
- Embedded meeting container
  - Needs `meetingLink`, visibility state, fixed height, internal scroll.
- Scroll containers
  - Used to stop lists from growing parent surfaces.
- Action trays
  - Shared pattern for grouped primary/secondary/danger session actions.

## 5. States & Interactions

### Loading states
- All major pages support full-page loading.
- Cache-first pages render cached data immediately, then show background refresh notice.

### Empty states
- No counselors matched.
- No open slots.
- No sessions.
- No notes.
- No resources.
- No notifications.

### Error states
- Full-page unavailable state when nothing cached.
- Inline banner when cached data exists but refresh fails.
- Field-level validation under inputs.

### Validation behavior
- Validation is live on change and blur for the major counseling forms.
- Errors are shown directly below the field in red.
- Search/filter fields often validate characters and length before changing the live query.

### Success states
- Counselor slot create/update/remove shows success banner.
- Counselor profile settings shows success banner.
- Student booking redirects to session list.
- Counselor note/session save reloads the latest room data.

### Disabled and edge states
- “Book open slot” disabled when counselor has no availability.
- Student booking update/delete shown only for `scheduled` or `checked_in`.
- Feedback shown only after `completed` and while not yet submitted.
- Counselor slot update/remove allowed only for `available` unbooked slots.
- Remote-room controls render only when `meetingLink` exists.
- In-person sessions should not render video/chat room actions.

## 6. Role-Based UI Differences

### Student sees
- discovery and booking surfaces
- personal session history
- personal session room actions
- student-visible summaries
- feedback form

### Counselor sees
- slot creation and inventory management
- booked-session operational controls
- private context
- private notes
- internal summary template
- resource recommendation controls
- notes list
- counselor inbox and profile settings

### Conditional rendering rules
- Students never see `privateContext`, `summaryTemplate`, or counselor notes.
- Counselors see those fields in session room.
- Buttons depend on current status.
- Permission-gated counselor sections should show info banners or hide controls when permission is missing.

## 7. Navigation Structure

### Student routes
- `/student/counselors`
- `/student/counselors/:counselorId`
- `/student/counseling/book`
- `/student/counseling/book/:counselorId`
- `/student/sessions`
- `/student/sessions/:sessionId`
- `/student/sessions/:sessionId/feedback`

### Counselor routes
- `/counselor/dashboard`
- `/counselor/sessions`
- `/counselor/sessions/:sessionId`
- `/counselor/notes`
- `/counselor/resources`
- `/counselor/notifications`
- `/counselor/profile-settings`

### Shared route
- `/join/counseling/:sessionId`

## 8. Existing UI Analysis

### KEEP
- Route structure in `client/src/router/AppRouter.jsx`.
- Student flow based on counselor-created slots.
- Cache-first hydration plus update events.
- Shared role shell pattern.
- Embedded live-room pattern with explicit show/hide control.
- Live validation with inline red field errors.
- Scroll-limited containers.
- Shared notifications inbox page.
- Shared resource browser integration.

### MODIFY
- `client/src/pages/student/counselingPages.jsx`
  - Good behavior, but too monolithic. Split into pages, hooks, and shared validation utilities when porting.
- `client/src/pages/counselor/portalPages.jsx`
  - Same: preserve behavior, reduce file density.
- Feedback page
  - Works, but is lighter than the rest of the module and should be strengthened to match the same validation/UX standard.
- Action tray styling
  - Centralize icon shells, spacing, and responsive wrapping instead of repeating adjustments.

### REMOVE
- Any UI that implies students create entirely new counseling sessions from scratch.
- Any counselor slot form that chooses a student during slot creation.
- Duplicate or inactive copies of counseling screens if encountered during migration.

### REPLACE
- Replace monolithic files with:
  - route page container
  - feature hook(s)
  - reusable presentation components
  - shared validators
- Replace ad-hoc local-storage/event syncing with a formal query/state layer if the new project has one.

## 9. Final UI Implementation Plan

### Must be built
- Student counselor directory
- Student counselor profile
- Student booking page for open slots
- Student session list
- Student session room
- Student feedback page
- Counselor dashboard
- Counselor sessions workspace
- Counselor session room
- Counselor notes page
- Counselor profile settings page
- Counselor resources page
- Counselor notifications page

### Must be reused
- Role shell pattern
- shared cards, banners, loader, empty state
- inline validation style
- remote-room action pattern
- shared resource and notifications integrations

### Must be removed
- Student-created slot flow
- Counselor-picks-student flow
- stale/dead duplicate pages

### Recommended rebuild order
1. Build shared primitives.
2. Build student discovery and booking pages.
3. Build counselor slot creation and session-room controls.
4. Add notes, resources, notifications, and profile settings.
5. Add cache invalidation or equivalent reactive synchronization so booking, deleting, and counselor updates stay in sync across pages.

## 10. Existing Project Adaptation Rules

Use this section when the target project already exists and the goal is to fit the counseling module into that codebase instead of rebuilding it as a standalone feature.

### Adaptation strategy
- Treat this file as a behavioral contract, not a forced file layout.
- Keep the target project’s current routing, page naming, component library, state layer, and theme system unless they block the required counseling behavior.
- Recreate the same flows and states even if the target project uses different folders, frameworks, or shared UI primitives.

### File-structure rules
- Do not copy the original repository’s monolithic file layout unless the target project already uses that style.
- Split or merge files to match the target project’s conventions.
- Prefer the target project’s existing locations for:
  - page components
  - feature hooks
  - API/query hooks
  - validation helpers
  - shared cards/forms/layout
- If the target project already has role-based pages, mount the counseling screens inside that existing role structure.

### UI adaptation rules
- Reuse the target project’s:
  - layout shell
  - typography system
  - spacing scale
  - form primitives
  - button styles
  - modal/dialog patterns
  - notification/toast pattern
- Preserve the counseling module’s interaction behavior even if visuals are restyled.
- Keep all role-based visibility rules and all state/edge-state handling.
- If the target project already has session cards, list containers, stat cards, or action trays, extend those components instead of duplicating them.

### Routing adaptation rules
- Keep the target project’s route organization.
- Only add new routes when the required counseling screen has no equivalent.
- If the project uses nested routes, tabs, drawers, or workspace panels instead of standalone pages, map the counseling screens into that structure while preserving page responsibilities.

### State-management adaptation rules
- If the target project already uses React Query, RTK Query, Redux, Zustand, or another state layer:
  - replace local ad-hoc cache helpers with that system
  - keep the same invalidation behavior:
    - slot created -> availability updates
    - slot booked -> student sessions update and availability shrinks
    - booking deleted -> slot reopens everywhere
    - counselor session update -> student session detail updates
    - note saved -> dashboard and note history update
- If the target project has no state layer, local cache plus event sync is acceptable.

### Implementation priority when adapting
1. Reuse existing role shell and route patterns.
2. Reuse existing shared form and card components.
3. Implement the counseling-specific business UI.
4. Add missing state synchronization.
5. Add missing empty/loading/error/success states.

### What must never be lost during adaptation
- Counselor creates slots first.
- Student books an existing slot.
- Students cannot see counselor-private notes or internal summaries.
- Students can update/delete eligible bookings.
- Deleting a booking restores the slot to availability.
- Counselors can only edit/remove unbooked open slots.
- Completed sessions support feedback and student-visible summaries.
