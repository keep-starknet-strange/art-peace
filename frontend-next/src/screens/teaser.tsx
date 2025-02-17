'use client';

const Teaser = (props: any) => {
  return (
    <div className="relative">
      <div className="w-[100vw] h-[100vh] overflow-hidden relative
        flex flex-col justify-center items-center">
          <div className="absolute top-[50%] left-[50%] transform
            -translate-x-1/2 -translate-y-1/2 h-[60rem] w-[80rem] bg-[rgba(0,0,0,0.5)]">
              <div className="flex flex-col justify-around items-center h-full w-full">
                <div className="flex flex-col justify-center items-center gap-10">
                  <h1 className="text-black text-6xl font-bold">art/peace round 3</h1>
                  <p className="text-black text-4xl">Feb 21st - Feb 24th</p>
                </div>
                <div className="flex flex-col justify-center items-center gap-5">
                  <p className="text-black text-4xl font-bold">Gas Free</p>
                  <p className="text-black text-4xl font-bold">Worlds</p>
                  <p className="text-black text-4xl font-bold">Agents</p>
                  <p className="text-black text-4xl font-bold">And More</p>
                </div>
                <p className="text-black text-4xl">coming soon...</p>
              </div>
          </div>
      </div>
    </div>
  );
}

export default Teaser;
