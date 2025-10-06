import "./HomeScreenHeading.css"

export default function HomeScreenHeading({title, logo}){
    return (
        <div className="home-screen-row">
            <img src={logo} alt="Clemson University Orange Tiger Paw" className="home-screen-logo"/>
            <h1 className="home-screen-title">{title}</h1>
        </div>
    );
}