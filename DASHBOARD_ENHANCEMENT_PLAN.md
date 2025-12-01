# Dashboard Enhancement Plan

## Requirements
1. Each section/box should be clickable to expand and show information below it
2. Each section should allow search functionality
3. Clicking on a specific dealer should navigate to that dealer's detail page

## Implementation Steps

### Step 1: Enhance Backend API
- Modify `/reports/dashboard` endpoint to optionally return dealer lists for each status/rating
- Add query parameter to fetch dealer details when needed
- Support pagination for large dealer lists

### Step 2: Create Dashboard Sections Component
- Make each stat box expandable/collapsible
- Add search input within each expanded section
- Display dealer list when expanded
- Add click handler to navigate to dealer detail page

### Step 3: Add State Management
- Track which sections are expanded
- Manage search terms for each section
- Handle loading states

### Step 4: Testing
- Test expand/collapse functionality
- Test search within sections
- Test navigation to dealer detail page
- Verify no breaking changes

## Sections to Implement
1. Total Dealers - Show all dealers with search
2. Dealers by Status - Show dealers grouped by status
3. Dealers by Rating - Show dealers grouped by rating
4. Active Todos - Show todos (if needed)
5. Recent Activity - Show recent dealers/notes (if needed)


