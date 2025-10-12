
import React, { useEffect, useState } from 'react';
import './App.css';

//Import components
import HomeScreenHeading from './components/HomeScreenHeading/HomeScreenHeading';
import EventList from './components/EventList/EventList';


//Defines / constants
const APP_TITLE = "TigerTix";
export const CLEMSON_LOGO = "/paw-orange.png";



function App() {
    const [events, setEvents] = useState([]);
    
    useEffect(() => {
        fetch('http://localhost:6001/api/events')
        .then((res) => res.json())
        .then((data) => setEvents(data))
        .catch((err) => console.error(err));
    }, []);

    return (
        <div className="App">
            <HomeScreenHeading
                title={APP_TITLE}
                logo={CLEMSON_LOGO}
            />
            <EventList
                events={events}
            />
            
        </div>
    );
}
export default App;