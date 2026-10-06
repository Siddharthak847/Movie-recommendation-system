import React from 'react';

import Search from './Components/search'
import Results from './Components/Results'

function App() {
  const[state ,setState] = useState({
    s:"",
    results: [],
    selected: {}
  
  });

  const apiurl = 'http://www.omdbapi.com/?i=tt3896198&apikey=34526b58';

  const search = (e) => {
    if (e.key === "Enter") {
      axios(apiurl + "&s=" + state.s).then(({ data }) => {
        let results = data.Search ;

        setState(prevState => {
          return { ...prevState, results: results }
        });
      });
    }
  }
      

  const handleInput = (e) => {
    let S = e.target.value;

    setState(prevState => {
      return { ...prevState, s: S }
    });
  }

  const openPopup = id => {
    axios(apiurl + "&i=" + id).then(({ data }) => {
      let result = data;

      console.log(result);
      setState(prevState => {
        return { ...prevState, selected: result }
      });
    });
  }

  const closePopup = () => {
    setState(prevState => {
      return { ...prevState, selected: {} }
    });
  }


  return (
    <>
      <div>
       
          <h1>Movie Name</h1>
          

           <main>

           <Search handleInput={handleInput} search={search} />
           <Results results={state.results} openPopup={openPopup} />
              {typeof state.selected.Title !== "" ? (
           <Popup selected={state.selected} closePopup={closePopup} />
            ) : null}

       </main>


          
        
      </div>
    </>
  );
}

export default App
