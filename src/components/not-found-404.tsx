'use client';

import React from 'react';

export function NotFound404() {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-[60vh] py-8">
      <div className="relative flex items-center justify-center" style={{ width: '30em', height: '30em' }}>
        {/* Main TV Component */}
        <div className="flex flex-col items-center justify-center" style={{ marginTop: '5em' }}>
          {/* Antenna */}
          <div className="relative rounded-full border-2 border-black bg-[#f27405]" style={{ width: '5em', height: '5em', marginBottom: '-6em', marginLeft: '0em', zIndex: -1 }}>
            <div className="absolute bg-transparent rounded-[45%] rotate-[140deg] border-4 border-transparent" 
              style={{ width: '50px', height: '56px', marginLeft: '1.68em', boxShadow: 'inset 0px 16px #a85103, inset 0px 16px 1px 1px #a85103' }} 
            />
            <div className="absolute rounded-full bg-[#f69e50]" style={{ marginTop: '-9.4em', marginLeft: '0.4em', transform: 'rotate(-25deg)', width: '1em', height: '0.5em' }} />
            <div className="absolute rounded-full bg-[#f69e50]" style={{ marginTop: '0.2em', marginLeft: '1.25em', transform: 'rotate(-20deg)', width: '1.5em', height: '0.8em' }} />
          </div>

          {/* Antenna Wires */}
          <div className="absolute rounded-[50px] bg-gradient-to-b from-[#171717] via-[#353535] to-[#171717]" 
            style={{ top: '-102%', left: '-130%', width: '12em', height: '5.5em', transform: 'rotate(-29deg)', clipPath: 'polygon(50% 0%, 49% 100%, 52% 100%)' }} 
          />
          <div className="absolute rounded-full border-2 border-black bg-[#979797] z-[99]" 
            style={{ top: '-211%', left: '-35%', transform: 'rotate(45deg)', width: '0.5em', height: '0.5em' }} 
          />
          <div className="absolute rounded-[50px] bg-gradient-to-b from-[#171717] via-[#353535] to-[#171717]" 
            style={{ top: '-210%', left: '-10%', width: '12em', height: '4em', marginRight: '5em', transform: 'rotate(-8deg)', clipPath: 'polygon(47% 0, 47% 0, 34% 34%, 54% 25%, 32% 100%, 29% 96%, 49% 32%, 30% 38%)' }} 
          />
          <div className="absolute rounded-full border-2 border-black bg-[#979797] z-[99]" 
            style={{ top: '-294%', left: '94%', width: '0.5em', height: '0.5em' }} 
          />

          {/* TV */}
          <div className="relative rounded-[15px] bg-[#d36604] flex justify-center border-2 border-[#1d0e01] overflow-hidden" 
            style={{ width: '17em', height: '9em', marginTop: '3em', boxShadow: 'inset 0.2em 0.2em #e69635' }}
          >
            {/* TV Screen Noise Effect */}
            <div className="absolute rounded-[15px] opacity-[0.09] mix-blend-difference" 
              style={{
                width: '17em', height: '9em',
                background: 'repeating-radial-gradient(#d36604 0 0.0001%, rgba(0,0,0,0.44) 0 0.0002%) 50% 0/2500px 2500px, repeating-conic-gradient(#d36604 0 0.0001%, rgba(0,0,0,0.44) 0 0.0002%) 60% 60%/2500px 2500px'
              }}
            />

            {/* Curve SVG */}
            <svg className="absolute" style={{ marginTop: '0.25em', marginLeft: '-0.25em', height: '12px', width: '12px' }} version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 189.929 189.929">
              <path d="M70.343,70.343c-30.554,30.553-44.806,72.7-39.102,115.635l-29.738,3.951C-5.442,137.659,11.917,86.34,49.129,49.13 C86.34,11.918,137.664-5.445,189.928,1.502l-3.95,29.738C143.041,25.54,100.895,39.789,70.343,70.343z" fill="currentColor" />
            </svg>

            {/* Display */}
            <div className="flex items-center justify-center self-center rounded-[15px]" style={{ boxShadow: '3.5px 3.5px 0px #e69635' }}>
              <div className="w-auto h-auto rounded-[10px]">
                <div className="flex items-center justify-center rounded-[10px]" style={{ width: '11em', height: '7.75em' }}>
                  {/* Desktop Screen */}
                  <div className="hidden lg:flex border-2 border-[#1d0e01] rounded-[10px] z-[99] items-center justify-center font-bold text-center"
                    style={{
                      width: '13em', height: '7.85em',
                      fontFamily: 'Montserrat',
                      background: 'repeating-radial-gradient(#000 0 0.0001%, #ffffff 0 0.0002%) 50% 0/2500px 2500px, repeating-conic-gradient(#000 0 0.0001%, #ffffff 0 0.0002%) 60% 60%/2500px 2500px',
                      backgroundBlendMode: 'difference',
                      animation: 'screenNoise 0.2s infinite alternate',
                      color: '#252525',
                      letterSpacing: '0.15em'
                    }}
                  >
                    <span className="bg-black text-white rounded-[5px] z-10" style={{ paddingLeft: '0.3em', paddingRight: '0.3em', fontSize: '0.75em', letterSpacing: '0' }}>NOT FOUND</span>
                  </div>

                  {/* Mobile Screen */}
                  <div className="lg:hidden relative rounded-[10px] border-2 border-black z-[99] flex items-center justify-center font-bold text-center overflow-hidden"
                    style={{
                      width: '13em', height: '7.85em',
                      fontFamily: 'Montserrat',
                      background: 'linear-gradient(to right, #002fc6 0%, #002bb2 14.2857142857%, #3a3a3a 14.2857142857%, #303030 28.5714285714%, #ff0afe 28.5714285714%, #f500f4 42.8571428571%, #6c6c6c 42.8571428571%, #626262 57.1428571429%, #0affd9 57.1428571429%, #00f5ce 71.4285714286%, #3a3a3a 71.4285714286%, #303030 85.7142857143%, white 85.7142857143%, #fafafa 100%)',
                      color: '#252525',
                      letterSpacing: '0.15em'
                    }}
                  >
                    <div className="absolute left-0 top-0 z-[1] w-full" style={{ height: '68.4782608696%', background: 'linear-gradient(to right, white 0%, #fafafa 14.2857142857%, #ffe60a 14.2857142857%, #f5dc00 28.5714285714%, #0affd9 28.5714285714%, #00f5ce 42.8571428571%, #10ea00 42.8571428571%, #0ed600 57.1428571429%, #ff0afe 57.1428571429%, #f500f4 71.4285714286%, #ed0014 71.4285714286%, #d90012 85.7142857143%, #002fc6 85.7142857143%, #002bb2 100%)' }} />
                    <div className="absolute left-0 bottom-0 z-[1] w-full" style={{ height: '21.7391304348%', background: 'linear-gradient(to right, #006c6b 0%, #005857 16.6666666667%, white 16.6666666667%, #fafafa 33.3333333333%, #001b75 33.3333333333%, #001761 50%, #6c6c6c 50%, #626262 66.6666666667%, #929292 66.6666666667%, #888888 83.3333333333%, #3a3a3a 83.3333333333%, #303030 100%)' }} />
                    <span className="bg-black text-white rounded-[5px] z-10 relative" style={{ paddingLeft: '0.3em', paddingRight: '0.3em', fontSize: '0.75em', letterSpacing: '0' }}>NOT FOUND</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lines */}
            <div className="flex self-end" style={{ columnGap: '0.1em' }}>
              <div className="bg-black rounded-t-[25px]" style={{ width: '2px', height: '0.5em', marginTop: '0.5em' }} />
              <div className="flex-grow bg-black rounded-t-[25px]" style={{ width: '2px', height: '1em' }} />
              <div className="bg-black rounded-t-[25px]" style={{ width: '2px', height: '0.5em', marginTop: '0.5em' }} />
            </div>

            {/* Buttons */}
            <div className="absolute bg-[#e69635] border-2 border-[#1d0e01] rounded-[10px] flex items-center justify-center flex-col shadow-[3px_3px_0px_#e69635]"
              style={{ width: '4.25em', alignSelf: 'center', height: '8em', padding: '0.6em', rowGap: '0.75em' }}
            >
              <div className="relative rounded-full bg-[#7f5934] border-2 border-black" 
                style={{ width: '1.65em', height: '1.65em', boxShadow: 'inset 2px 2px 1px #b49577, -2px 0px #513721, -2px 0px 0px 1px black' }}
              >
                <div className="absolute rounded-[5px] bg-black" style={{ marginTop: '1em', marginLeft: '0.5em', transform: 'rotate(47deg)', width: '0.1em', height: '0.4em' }} />
                <div className="absolute rounded-[5px] bg-black" style={{ marginTop: '0.9em', marginLeft: '0.8em', transform: 'rotate(47deg)', width: '0.1em', height: '0.55em' }} />
                <div className="absolute bg-black" style={{ marginTop: '-0.1em', marginLeft: '0.65em', transform: 'rotate(45deg)', width: '0.15em', height: '1.5em' }} />
              </div>
              <div className="relative rounded-full bg-[#7f5934] border-2 border-black" 
                style={{ width: '1.65em', height: '1.65em', boxShadow: 'inset 2px 2px 1px #b49577, -2px 0px #513721, -2px 0px 0px 1px black' }}
              >
                <div className="absolute rounded-[5px] bg-black" style={{ marginTop: '1.05em', marginLeft: '0.8em', transform: 'rotate(-45deg)', width: '0.15em', height: '0.4em' }} />
                <div className="absolute bg-black" style={{ marginTop: '-0.1em', marginLeft: '0.65em', transform: 'rotate(-45deg)', width: '0.15em', height: '1.5em' }} />
              </div>
              <div className="flex flex-col" style={{ rowGap: '0.5em' }}>
                <div className="flex" style={{ columnGap: '0.25em' }}>
                  <div className="rounded-full bg-[#7f5934] border-2 border-black" style={{ width: '0.65em', height: '0.65em', boxShadow: 'inset 1.25px 1.25px 1px #b49577' }} />
                  <div className="rounded-full bg-[#7f5934] border-2 border-black" style={{ width: '0.65em', height: '0.65em', boxShadow: 'inset 1.25px 1.25px 1px #b49577' }} />
                  <div className="rounded-full bg-[#7f5934] border-2 border-black" style={{ width: '0.65em', height: '0.65em', boxShadow: 'inset 1.25px 1.25px 1px #b49577' }} />
                </div>
                <div className="bg-[#171717]" style={{ width: 'auto', height: '2px' }} />
                <div className="bg-[#171717]" style={{ width: 'auto', height: '2px' }} />
              </div>
            </div>
          </div>

          {/* Bottom Base */}
          <div className="w-full h-auto flex items-center justify-center" style={{ columnGap: '8.7em' }}>
            <div className="border-2 border-[#171717] bg-[#4d4d4d] -z-10" style={{ height: '1em', width: '2em', marginTop: '-0.15em' }} />
            <div className="border-2 border-[#171717] bg-[#4d4d4d] -z-10" style={{ height: '1em', width: '2em', marginTop: '-0.15em' }} />
            <div className="absolute bg-[#171717]" style={{ height: '0.15em', width: '17.5em', marginTop: '0.8em' }} />
          </div>
        </div>

        {/* 404 Text Background */}
        <div className="absolute flex flex-row items-center justify-center -z-[5] opacity-50" 
          style={{ marginBottom: '2em', columnGap: '6em', transform: 'scaleY(24.5) scaleX(9)', fontFamily: 'Montserrat' }}
        >
          <div className="text-4xl font-bold">4</div>
          <div className="text-4xl font-bold">0</div>
          <div className="text-4xl font-bold">4</div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes screenNoise {
          100% {
            background-position: 50% 0, 60% 50%;
          }
        }
        @media (max-width: 1024px) {
          .lg\\:hidden {
            display: flex !important;
          }
          .lg\\:flex {
            display: none !important;
          }
        }
        @media (min-width: 1025px) {
          .lg\\:flex {
            display: flex !important;
          }
          .lg\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

