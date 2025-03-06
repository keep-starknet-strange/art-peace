'use client';

import Image from 'next/image';

const Teaser = (props: any) => {
  const xPage = "https://www.x.com/art_peace_sn";
  const ghPage = "https://www.github.com/keep-starknet-strange/art-peace";
  const tgPage = "https://t.me/art_peace_starknet/1";
  
  return (
    <div className="relative">
      <div className="w-[100vw] h-[100vh] overflow-hidden relative
        flex flex-col justify-center items-center">
          <div className="absolute top-[50%] left-[50%] transform
            -translate-x-1/2 -translate-y-1/2 h-[60rem] w-[80rem] bg-[rgba(0,0,0,0)]">
              <div className="flex flex-col justify-around items-center h-full w-full">
                <video autoPlay loop controls className="mb-[1rem] h-full w-full object-cover" src="/videos/art-peace-round-3-nofade.mp4" />
                <div className="flex flex-col justify-center items-center gap-10">
                  <h1 className="text-black text-8xl font-bold">art/peace</h1>
                  <p className="text-black text-3xl">LFDrawww!!!</p>
                  <div className="flex justify-center items-center gap-4">
                    <button className="rounded-full overflow-hidden w-[100px]" onClick={() => window.open(xPage)}>
                      <Image src="/icons/x.png" alt="x-logo" width={100} height={100} />
                    </button>
                    <button className="rounded-full overflow-hidden w-[60px] mr-[1.8rem]" onClick={() => window.open(ghPage)}>
                      <Image src="/icons/gh.png" alt="github-logo" width={100} height={100} />
                    </button>
                    <button className="rounded-full overflow-hidden w-[60px] mr-[2.4rem]" onClick={() => window.open(tgPage)}>
                      <Image src="/icons/tg.webp" alt="telegram-logo" width={100} height={100} />
                    </button>
                  </div>
                </div>
              </div>
          </div>
      </div>
    </div>
  );
}

export default Teaser;
