'use client'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setBreadcrumbPath } from "@/redux/reuducer/breadCrumbSlice"
import { truncate } from "@/utils"

const BlogBreadcrumbHandler = ({ title, tOurBlogs }) => {
    const dispatch = useDispatch()

    useEffect(() => {
        if (title) {
            dispatch(setBreadcrumbPath([
                { name: tOurBlogs || "Our Blogs", slug: '/blogs' },
                { name: truncate(title, 30) }
            ]))
        }
    }, [title, tOurBlogs, dispatch])

    return null // This component doesn't render anything, it just handles the side effect
}

export default BlogBreadcrumbHandler
