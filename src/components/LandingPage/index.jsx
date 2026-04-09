import AnythingYouWant from './AnythingYouWant'
import WorkProcess from './WorkProcess'
import OurBlogs from './OurBlogs'
import QuickAnswers from './QuickAnswers'
// import LandingCta from './LandingCta'


const LandingPage = ({ initialQuickSearchItems }) => {
  return (
    <>
      <AnythingYouWant initialQuickSearchItems={initialQuickSearchItems} />
      <WorkProcess />
      <OurBlogs />
      <QuickAnswers />
      
      {/* <LandingCta /> */}
      
    </>
  )
}

export default LandingPage
