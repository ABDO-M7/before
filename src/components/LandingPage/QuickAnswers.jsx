'use client'
import { CurrentLanguageData } from "@/redux/reuducer/languageSlice.js"
import { getFaqApi } from "@/utils/api.js"
import { t } from "@/utils/index.jsx"
import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import QuickAnswerAccordion from "./QuickAnswerAccordion"
import Skeleton, { SkeletonTheme } from "react-loading-skeleton"

// FAQ Skeleton component to prevent CLS
const FaqSkeleton = () => (
    <SkeletonTheme baseColor="lightgray" highlightColor="#e0e0e0">
        <div style={{ minHeight: '300px' }}>
            {[1, 2, 3, 4].map((item) => (
                <div key={item} style={{ marginBottom: '16px', padding: '16px', borderRadius: '8px', background: '#f5f5f5' }}>
                    <Skeleton height={24} width="70%" />
                    <Skeleton height={16} width="90%" style={{ marginTop: '8px' }} />
                </div>
            ))}
        </div>
    </SkeletonTheme>
)

const QuickAnswers = () => {
    const [Faq, setFaq] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const CurrentLanguage = useSelector(CurrentLanguageData)

    const getFaqData = async () => {
        try {
            setIsLoading(true)
            const res = await getFaqApi.getFaq()
            setFaq(res?.data?.data)
        } catch (error) {
            console.log(error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        getFaqData()
    }, [])


    return (
        <div className="quick_answers" id="faq">
            {(isLoading || (Faq && Faq.length > 0)) &&
                <div className="container">
                    <div className="row">
                        <div className="ourblogs_header">
                            {/* <p className="ourblogs_title">{t('navigating')}</p> */}
                            <h1 className="Ourblogs_maintitle">
                                {t('quickAnswers')}
                            </h1>
                        </div>
                        <div className="quickanswer_accordion_wrapper">
                            {isLoading ? <FaqSkeleton /> : <QuickAnswerAccordion Faq={Faq} />}
                        </div>
                    </div>
                </div>
            }
        </div>

    )
}

export default QuickAnswers