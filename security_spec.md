# Security Specification & Threat Model for VocaBloom

## 1. Data Invariants
1. **User Identity & Role Immutability**: A user cannot escalate their own role (e.g. student becoming manager). Roles (`manager`, `teacher`, `student`) can only be modified by a manager.
2. **Student Isolation**: A student can only write to their own sub-collections (`user_words`, `quiz_attempts`, `level_exam_attempts`, `ai_paragraphs`).
3. **Public Vocabulary Immutability**: The 3,000 standard vocabulary words can only be created/edited by teachers and managers, but can be read by all authenticated users.
4. **Class Boundaries**: Only teachers and managers can create and edit classes.
5. **Announcement Integrity**: Announcements can only be created by teachers or managers; students can only acknowledge their own read receipt.
6. **Activity Log Integrity**: Students can log their own activities, with verified student IDs matching `request.auth.uid`.

## 2. The "Dirty Dozen" Payloads (Must Return PERMISSION_DENIED)
1. **Payload 1 (Self Role Escalation)**: Student attempts to update `users/{studentId}` setting `role: 'manager'`.
2. **Payload 2 (Cross-User Word Record Tampering)**: Student A writes to `/students/{studentB_Id}/user_words/w-a1-1`.
3. **Payload 3 (Vocabulary Vandalism)**: Student attempts to `delete` or `update` `/vocabulary/w-a1-8`.
4. **Payload 4 (Fake Exam Score Injection)**: Unauthenticated user or Student A writing an exam score to Student B's profile.
5. **Payload 5 (ID Poisoning Attack)**: Injecting a 2KB string as `studentId` or document ID.
6. **Payload 6 (Announcement Forgery)**: Student attempts to `create` an announcement pretending to be a teacher.
7. **Payload 7 (Ghost Field Injection)**: Attempting to update `students/{studentId}` with shadow field `isVerifiedAdmin: true`.
8. **Payload 8 (Blanket Read Scraping)**: Unauthenticated scraper requesting the `/users` collection without proper auth filter.
9. **Payload 9 (Negative / Overflow XP)**: Client injecting `bloomScore: -999999` or non-numeric types.
10. **Payload 10 (Class Hijacking)**: Teacher A attempting to delete Teacher B's class.
11. **Payload 11 (Oversized Payload)**: Inserting a 50KB string into `meaningTr` exceeding `maxLength: 200`.
12. **Payload 12 (Impersonated Activity Log)**: Student A generating an activity log where `studentId` is set to Student B.
