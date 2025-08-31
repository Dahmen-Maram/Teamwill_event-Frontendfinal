# Google Sheets Integration for Event Statistics

## Overview

This feature integrates Google Sheets data with Chart.js to display comprehensive statistics for events. When an event has a `sheetId` associated with it, users can view detailed analytics and charts based on the form responses.

## Features

### 1. Automatic Chart Generation
- **Bar Charts**: For numerical data (scores, ratings, etc.)
- **Pie Charts**: For categorical data (multiple choice questions)
- **Line Charts**: For time-based data (timestamps, dates)

### 2. Smart Data Analysis
- Automatically detects data types
- Generates appropriate chart types based on content
- Handles missing or empty data gracefully

### 3. Summary Statistics
- Total questions analyzed
- Total responses received
- Chart type distribution
- Real-time data processing

## Implementation

### Backend Integration

The system uses your existing NestJS backend with the Google Sheets service:

```typescript
// GoogleSheetController
@Get(':sheetId')
async getFormResponses(@Param('sheetId') sheetId: string) {
  const responses = await this.sheetsService.getResponses(sheetId);
  return responses;
}
```

### Frontend API Route

```typescript
// /api/fetch-sheet/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sheetId = searchParams.get('sheetId');
  
  const response = await fetch(`${backendUrl}/forms/${sheetId}`);
  return NextResponse.json(await response.json());
}
```

### Event Type Update

The `Event` interface now includes a `sheetId` field:

```typescript
export interface Event {
  // ... existing fields
  sheetId?: string;
}
```

## Usage

### 1. Adding Sheet ID to Events

When creating or updating an event, include the Google Sheet ID:

```typescript
const event = {
  titre: "My Event",
  // ... other fields
  sheetId: "1VUZphArq8WrrPDKaqimHpzpOS4dDq1xy0BEZIkipEVs"
};
```

### 2. Viewing Statistics

Users can access statistics in two ways:

1. **From Event Management Page**: Click "View Statistics" button on events with sheetId
2. **From Statistics Page**: Navigate to `/marketing/stat` and select an event

### 3. URL Parameters

Direct access to specific event statistics:
```
/marketing/stat?eventId=event-uuid
```

## Chart Types

### Bar Charts
- Used for: Numerical ratings, scores, counts
- Example: "Notez globalement l'événement" (1-5 ratings)

### Pie Charts
- Used for: Multiple choice questions, categories
- Example: "Quel est votre rôle ?" (Manager, Employee, etc.)

### Line Charts
- Used for: Time-based data, trends
- Example: "Horodateur" (response timestamps)

## Data Format

The system expects Google Sheets data in this format:

```json
[
  ["Horodateur", "Score", "Quel est votre nom ?", "Quel est votre rôle ?"],
  ["29/07/2025 10:26:32", "0 / 2", "test", "Manager"],
  ["29/07/2025 10:30:15", "1 / 2", "user2", "Employee"]
]
```

## Error Handling

- Graceful handling of missing sheetId
- Fallback for API failures
- Empty state for events without data
- Loading states during data fetching

## Security

- Sheet ID validation
- Backend authentication required
- CORS protection
- Rate limiting (via backend)

## Future Enhancements

1. **Export Functionality**: Download charts as images/PDF
2. **Real-time Updates**: WebSocket integration for live data
3. **Advanced Analytics**: Trend analysis, correlation charts
4. **Custom Chart Types**: User-defined chart configurations
5. **Data Filtering**: Date ranges, response filtering
