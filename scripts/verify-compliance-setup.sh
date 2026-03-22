#!/bin/bash
# Compliance Dashboard Verification Script
# Verifies all required files are present for the compliance dashboards

echo "🔍 Verifying Compliance Dashboard Implementation..."
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track errors
ERRORS=0

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1 (MISSING)"
        ((ERRORS++))
    fi
}

echo "📁 Dashboard Pages:"
check_file "src/app/admin/compliance/kri/page.tsx"
check_file "src/app/admin/compliance/bon-reporting/page.tsx"
check_file "src/app/admin/compliance/calendar/page.tsx"
check_file "src/app/admin/compliance/alerts/page.tsx"
echo ""

echo "🔧 Components:"
check_file "src/components/admin/kri-card.tsx"
check_file "src/components/admin/stats-card.tsx"
check_file "src/components/admin/alert-banner.tsx"
check_file "src/components/admin/status-indicator.tsx"
echo ""

echo "🌐 API Layer:"
check_file "src/lib/api/compliance.ts"
check_file "src/lib/api/compliance-mock.ts"
echo ""

echo "📊 Export Utilities:"
check_file "src/lib/export/kri-export.ts"
check_file "src/lib/export/kri-pdf.tsx"
echo ""

echo "🔄 Hooks:"
check_file "src/lib/hooks/use-compliance-polling.ts"
echo ""

echo "📝 Types:"
check_file "src/lib/types/compliance.ts"
echo ""

echo "📚 Documentation:"
check_file "docs/ADMIN_AND_API_REFERENCE.md"
check_file "docs/compliance/SETUP.md"
echo ""

echo "⚙️  Configuration:"
check_file ".env.example"
check_file "package.json"
echo ""

# Check dependencies
echo "📦 Checking Dependencies..."
if grep -q "react-big-calendar" package.json; then
    echo -e "${GREEN}✓${NC} react-big-calendar"
else
    echo -e "${RED}✗${NC} react-big-calendar (MISSING)"
    ((ERRORS++))
fi

if grep -q "@react-pdf/renderer" package.json; then
    echo -e "${GREEN}✓${NC} @react-pdf/renderer"
else
    echo -e "${RED}✗${NC} @react-pdf/renderer (MISSING)"
    ((ERRORS++))
fi

if grep -q "recharts" package.json; then
    echo -e "${GREEN}✓${NC} recharts"
else
    echo -e "${RED}✗${NC} recharts (MISSING)"
    ((ERRORS++))
fi

if grep -q "date-fns" package.json; then
    echo -e "${GREEN}✓${NC} date-fns"
else
    echo -e "${RED}✗${NC} date-fns (MISSING)"
    ((ERRORS++))
fi
echo ""

# Check environment variables
echo "🔑 Environment Configuration:"
if grep -q "NEXT_PUBLIC_SMARTPAY_API_URL" .env.example; then
    echo -e "${GREEN}✓${NC} SMARTPAY_API_URL configured in .env.example"
else
    echo -e "${YELLOW}⚠${NC} SMARTPAY_API_URL not in .env.example"
fi

if grep -q "NEXT_PUBLIC_USE_MOCK_COMPLIANCE" .env.example; then
    echo -e "${GREEN}✓${NC} USE_MOCK_COMPLIANCE configured in .env.example"
else
    echo -e "${YELLOW}⚠${NC} USE_MOCK_COMPLIANCE not in .env.example"
fi
echo ""

# Summary
echo "════════════════════════════════════════"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Copy .env.example to .env.local"
    echo "2. Set NEXT_PUBLIC_USE_MOCK_COMPLIANCE=true for testing"
    echo "3. Run: npm run dev"
    echo "4. Navigate to: http://localhost:3000/admin/compliance/kri"
else
    echo -e "${RED}❌ $ERRORS error(s) found!${NC}"
    echo "Please review the missing files above."
    exit 1
fi
echo "════════════════════════════════════════"
