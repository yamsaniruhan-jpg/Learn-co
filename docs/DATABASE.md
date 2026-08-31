# Learn.co — Database Schema & Data Models

## Volume 4 Creator Studio Entities

### 1. `creatorSources`
- `id` (string, PK)
- `userId` (string, FK -> users.id)
- `title` (string)
- `sourceType` (`'pdf' | 'url' | 'text'`)
- `originalUrl` (string, optional)
- `fileName` (string, optional)
- `fileSize` (number, optional)
- `extractedText` (string)
- `wordCount` (number)
- `metadata` (Record<string, any>)
- `createdAt` (string, ISO timestamp)
- `updatedAt` (string, ISO timestamp)

### 2. `creatorResources`
- `id` (string, PK)
- `userId` (string, FK -> users.id)
- `sourceId` (string, FK -> creatorSources.id, optional)
- `title` (string)
- `resourceType` (`'flashcards' | 'quiz' | 'summary' | 'notes' | 'slides' | 'worksheet' | 'mindmap' | 'key_concepts'`)
- `subjectId` (`'math' | 'physics' | 'cs' | 'chemistry' | 'biology'`)
- `difficulty` (`'easy' | 'medium' | 'hard'`)
- `version` (number, defaults to 1)
- `content` (Resource-specific JSON content)
- `tags` (string[])
- `isPublic` (boolean)
- `createdAt` (string, ISO timestamp)
- `updatedAt` (string, ISO timestamp)

### 3. `creatorResourceVersions`
- `id` (string, PK)
- `resourceId` (string, FK -> creatorResources.id)
- `versionNumber` (number)
- `content` (JSON snapshot)
- `changelog` (string)
- `createdAt` (string, ISO timestamp)

### 4. `creatorJobs`
- `id` (string, PK)
- `userId` (string, FK -> users.id)
- `resourceType` (string)
- `status` (`'pending' | 'processing' | 'completed' | 'failed'`)
- `progress` (number)
- `errorMessage` (string, optional)
- `resultResourceId` (string, optional)
- `createdAt` (string, ISO timestamp)
- `completedAt` (string, optional)
