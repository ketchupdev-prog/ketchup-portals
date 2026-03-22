# Compliance Dashboard Setup Guide

Quick start guide for the KRI and Compliance monitoring dashboards.

## Prerequisites

- Node.js 18+ installed
- Next.js 16 project running
- SmartPay backend (optional - mock data available)

## Installation

All dependencies are already included in `package.json`. No additional installation needed.

## Configuration

### 1. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

### 2. Configure SmartPay API

Edit `.env.local` and set:

```bash
# SmartPay Backend URL
NEXT_PUBLIC_SMARTPAY_API_URL=http://localhost:3001

# Use mock data for development (true/false)
NEXT_PUBLIC_USE_MOCK_COMPLIANCE=true
```

### 3. Mock Data Mode

For development without SmartPay backend:

```bash
NEXT_PUBLIC_USE_MOCK_COMPLIANCE=true
```

For production with SmartPay backend:

```bash
NEXT_PUBLIC_USE_MOCK_COMPLIANCE=false
NEXT_PUBLIC_SMARTPAY_API_URL=https://your-smartpay-backend.vercel.app
```

## Running the Application

```bash
npm run dev
```

Navigate to:
- **KRI Dashboard**: `http://localhost:3000/admin/compliance/kri`
- **BoN Reporting**: `http://localhost:3000/admin/compliance/bon-reporting`
- **Calendar**: `http://localhost:3000/admin/compliance/calendar`
- **Alerts**: `http://localhost:3000/admin/compliance/alerts`

## Features

### KRI Dashboard
- ✅ 12 Key Risk Indicators with real-time data
- ✅ 7-day trend charts
- ✅ Status color coding (Good/Warning/Critical)
- ✅ Export to CSV, XML, PDF
- ✅ Drill-down details for each KRI
- ✅ Auto-refresh every 60 seconds

### BoN Reporting
- ✅ Report submission queue
- ✅ 24-hour deadline tracking
- ✅ Overdue alerts
- ✅ Manual submit/retry
- ✅ Auto-refresh every 10 seconds

### Compliance Calendar
- ✅ Monthly calendar view
- ✅ Color-coded events by type
- ✅ Upcoming events (30 days)
- ✅ Event details modal

### Compliance Alerts
- ✅ Active/Resolved filtering
- ✅ Severity-based badges
- ✅ Alert resolution workflow
- ✅ Auto-refresh every 30 seconds

## Troubleshooting

### "Failed to fetch" errors

**Solution**: Enable mock data mode:
```bash
NEXT_PUBLIC_USE_MOCK_COMPLIANCE=true
```

### Calendar not displaying

**Solution**: Ensure `react-big-calendar` CSS is imported (already done in page component)

### PDF export not working

**Solution**: Check `@react-pdf/renderer` is installed:
```bash
npm install @react-pdf/renderer
```

### Real-time updates not working

**Solution**: Check polling hooks are enabled and intervals are set correctly

## SmartPay Backend Integration

When ready to connect to SmartPay backend:

1. Ensure backend is running
2. Set `NEXT_PUBLIC_USE_MOCK_COMPLIANCE=false`
3. Set correct `NEXT_PUBLIC_SMARTPAY_API_URL`
4. Backend should implement these endpoints:

```
GET  /api/v1/compliance/kri
GET  /api/v1/compliance/bon-reporting
POST /api/v1/compliance/bon-reporting/:id/submit
GET  /api/v1/compliance/alerts
POST /api/v1/compliance/alerts/:id/resolve
GET  /api/v1/compliance/calendar
```

## Testing

### Manual Testing Checklist

- [ ] Load KRI dashboard with 12 metrics
- [ ] Verify trend charts render
- [ ] Test export (CSV, XML, PDF)
- [ ] Click KRI card to view details
- [ ] Load BoN reporting queue
- [ ] Submit a pending report
- [ ] View calendar events
- [ ] Filter alerts by status
- [ ] Resolve an alert

## Support

For questions or issues:
- See [../ADMIN_AND_API_REFERENCE.md](../ADMIN_AND_API_REFERENCE.md) and [../README.md](../README.md)
- Check SmartPay backend logs
- Review browser console for errors

## Next Steps

1. ✅ Set up environment variables
2. ✅ Enable mock data mode for testing
3. ✅ Test all 4 dashboards
4. ⏳ Connect to SmartPay backend
5. ⏳ Configure BoN API credentials
6. ⏳ Set up production monitoring

---

**Last Updated**: March 22, 2026  
**Version**: 1.0.0
