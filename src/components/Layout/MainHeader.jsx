'use client'
import Header from "./Header"

// Landing page is now at /overview, and home page is at /
// Both routes use Header (not LandingPageHeader per requirements)
// nor prop is unused (kept for API compatibility)
const MainHeader = ({ nor, initialQuickSearchItems }) => {
  return <Header initialQuickSearchItems={initialQuickSearchItems} />
}

export default MainHeader