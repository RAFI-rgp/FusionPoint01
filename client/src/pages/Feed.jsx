import React, { useEffect, useState } from 'react'
import { assets, dummyPostsData } from '../assets/assets'
import Loading from '../components/Loading.jsx'
import Storiesbar from '../components/StoriesBar.jsx'
import PostCard from '../components/PostCard.jsx'
import RecentMessages from '../components/RecentMessages.jsx'
import { useAuth } from '@clerk/clerk-react'
import api from '../api/axios.js'
import toast from 'react-hot-toast'

const Feed = () => {

  const [feeds, setFeeds] = useState([])
  const [loading, setLoading] = useState(true)
  const { getToken } = useAuth()


  const fetchFeeds = async () => {
    setFeeds(dummyPostsData)
    // try {
    //   setLoading(true)
    //   const {data} = await api.get('/api/post/feed', {headers: {Authorization:`Bearer ${await getToken()}`}} )

    //   if (data.success){
    //     setFeeds(data.posts)
    //   }else{
    //     toast.error(data.message)
    //   }
    // } catch (error) {
    //   toast.error(error.message)
    // }
    setLoading(false)
  }

  useEffect(() => {
    fetchFeeds()
  }, [])

  return !loading ? (
    <div className="h-full overflow-y-scroll no-scrollbar py-10 xl:pr-5 flex items-start justify-center xl:gap-8">
      {/* Stories + Posts  list */}
      <div className="">
        <Storiesbar />
        <div className="p-4 space-y-6">
          {feeds.map((post, index) => (
            <PostCard key={post._id || index} post={post} />
          ))}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="max-xl:hidden ">
        <div className="max-w-xs bg-white text-xs p-4 rounded-md inline-flex flex-col gap-2 shadow-md border border-slate-200">
          <h3 className="text-slate-800 font-semibold">Sponsored</h3>
          <img
            src={assets.sponsored_img}
            className="w-[75px] h-[50px] rounded-md object-cover"
            alt="Sponsored"
            loading="lazy"
          />
          <p className="text-slate-600 font-medium">Email Marketing</p>
          <p className="text-slate-400 leading-snug">
            SuperCharge your marketing with a powerful, easy-to-use platform
            built for results.
          </p>
        </div>

        {/* Recent messages section */}
        <div className="mt-4">
          <RecentMessages />
        </div>
      </div>
    </div>
  ) : <Loading />
}

export default Feed
