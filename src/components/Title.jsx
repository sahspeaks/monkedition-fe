import React from 'react'

export function Title({ text1, text2 }) {
  return (
    <div className='inline-flex gap-2 items-center mb-3'>
      <p className='text-black'>{text1}<span className='text-orange-700 font-medium'>{text2}</span></p>
      <p className='w-8 sm:w-12 h-[1px] sm:h-[2px] bg-gray-700'></p>
    </div>

  )
}

export function BoldTitle({ text1, text2 }) {
  return (
      <div className="text-center mb-6 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-gray-800 mb-3 sm:mb-4 tracking-tight">
            {text1}
            <span className="bg-gradient-to-r from-orange-500 to-orange-700 bg-clip-text text-transparent"> {text2}</span>
          </h1>

        </div>
  )
}




export function ProductTitle({ name, price }) {
  return (

    <div className=' px-2 py-1 text-black  w-full rounded-b-lg bg-gray/30 pb-2'>
      <p className="text-base sm:text-lg lg:text-xl  mb-1 ">{name}</p>
      <p className="text-xs sm:text-sm lg:text-base text-black bg-orange-500 w-fit px-1.5 py-0.5 rounded-full font-medium ">
        ${price}
      </p>
    </div>
  )
}

