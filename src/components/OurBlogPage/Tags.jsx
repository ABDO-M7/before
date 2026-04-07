'use client'
import { searchedTag, setSearchTag } from "@/redux/reuducer/searchSlice"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"

const Tags = ({ data, tTags, tAll }) => {
    const tag = useSelector(searchedTag)
    const router = useRouter()
    const dispatch = useDispatch()
    const selectedTag = tag 
    const handleGetTagsBlogs = (e, tag) => {
        e.preventDefault();
        dispatch(setSearchTag(tag))
        router.push('/blogs')
    }

    const handleGetAllTagsBlogs = (e) => {
        e.preventDefault();
        dispatch(setSearchTag(""))
        router.push('/blogs')
    }

    return (
        <div className="tags">
            <h6 className="tags_title">{tTags}</h6>
            <div className="tags_item_wrapper">
                <button
                    className={selectedTag === "" ? "active" : ""}
                    onClick={(e) => handleGetAllTagsBlogs(e)}
                >
                    {tAll}
                </button>
                {data?.map((tag, index) => (
                    <button
                        key={index}
                        className={selectedTag === tag ? "active" : ""}
                        onClick={(e) => handleGetTagsBlogs(e, tag)}
                    >
                        {tag}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default Tags