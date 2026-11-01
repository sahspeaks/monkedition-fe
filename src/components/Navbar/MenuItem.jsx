import React from 'react'

function MenuItem({name,forceShowDash}) {
  return (
    <div className="flex flex-col items-center gap-1 ">
           <p>{name}</p>
           <hr className={`w-2/4 border-none h-[3px] bg-orange-400 ${forceShowDash?'':'hidden'}  rounded`} />
    </div>
  )
}

export default MenuItem
