import React from 'react'

function search({ handleInput , search }) {
  return (
    <section className="searchbox-wrap">
      <input
       type="text"
          placeholder="Search for a movie..." 
            className="search-input" 
             onChange={handleInput}     
             onkeyPress={search}
             />
    </section>   
  )

}
export default search       