import { ActivityIcon, CircleCheckIcon, ClockIcon, SendIcon, Share2Icon, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react"
import { dummyAccountsData, dummyActivityData, dummyPostsData } from "../assets/assets";

const Dashboard = () => {
const [stats , setStats]= useState({
  scheduled :0,
  published:0,
  connectedAccounts:0
})

const [activities, setActivities]= useState<any[]>([]);
useEffect(()=>{
const fetchDashboardData=async()=>{
  try {
    
    const [postsRes,accountsRes, activityRes]=[{data:dummyPostsData}, {data:dummyAccountsData},{data:dummyActivityData} ]
    const posts = postsRes.data;
    setStats({
      scheduled:posts.filter((p:any)=>p.status==='scheduled').length,

      published:posts.filter((p:any)=>p.status==='published').length,
    
      connectedAccounts:accountsRes.data.filter((a:any)=>a.status==='connected').length,
    })
    setActivities(activityRes.data)
  } catch (error) {
    
  }
}
fetchDashboardData()
},[])

const statCards=[ 
  {
lable :"Scheduled Posts",
value:stats.scheduled,
icon:ClockIcon,
trend:"+2 today"
},
  {
lable :"Published Posts",
value:stats.published,
icon:CircleCheckIcon,
trend:"All Time"
},
  {
lable :"Connected Accounts",
value:stats.connectedAccounts,
icon:Share2Icon,
trend:"Active"
},
]
  return (
    <div className="space-y-8">
      {/* Welcome Bar */}

      <div className="">
        <h2 className="text-slate-500 text-sm mt-0.5">
          Good Morning 
        </h2>
        <p>Here's what's happening wit your socil accounts today </p>
      </div>
      {/* Stats Card  */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      
{
  statCards.map((card, index) => (
    <div
      key={index}
      className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-red-200 hover:bg-red-50 hover:shadow-lg"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="text-3xl font-semibold tabular-nums text-slate-800">
          {card.value}
        </div>

        <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-500">
          <TrendingUp className="size-3" />
          {card.trend}
        </div>
      </div>

      <p className="mt-2 text-sm font-medium text-slate-500">
        {card.lable}
      </p>
    </div>
  ))
}       
      </div>
         {/* Activity Feed */}
     <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
<h2 className="text-slate-900"> Recent Activity </h2>
        <span className="text-sm text-slate-400">0 Events </span>
          </div>

{activities.length===0?
<div className="flex flex-col items-center justify-center py-16 px-6">
  <div className="size-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
    <ActivityIcon className="size-6 text-slate-400"/></div>
    {/*  */}
    <p className="text-slate-500">No Activity Yet </p>
    <p className="text-slate-400 text-sm mt-1"> Coonect Accounts and Schedule posts to see events </p>
</div>
:
<div className="divide-y divide-slate-50">
  {
    activities.map((activity)=>(
      <div key={activity._id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors">

<div className="size-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 bg-zinc-100 text-zinc-600">
  <SendIcon className="size-4"/>
</div>
<div className="flex-1 min-w-0">
<div className="flex items-center justify-between gap-2 mb-1">
<span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">Published</span>
<span  className="text-xs text-slate-400 shrink-0">{new Date(activity.createdAt).toLocaleString()}</span>
</div>
<p className="text-sm text-slate-600">{activities.description}</p>
</div>
      </div>
    ))
  }
</div>
}

          </div>      
    </div>
  )
}

export default Dashboard
