import { useState } from "react"
import Sidebar from "../components/mainPage/Sidebar"
import CalendarGrid from "../components/mainPage/CalendarGrid"
import Header from "../components/mainPage/Header"

export default function MainPage(){
    const [currentDate, setCurrentDate] = useState(new Date())
    const [events, setEvents] = useState([
        {
            id: 1,
            title: "Team Meeting",
            start: new Date(2025, 1, 24, 10, 0),
            end: new Date(2025, 1, 24, 11, 30),
        },
        {
            id: 2,
            title: "Lunch with Client",
            start: new Date(2025, 1, 25, 12, 0),
            end: new Date(2025, 1, 25, 13, 30),
        },
    ])

    const addEvent = (newEvent) => {
        setEvents([...events, { id: Date.now(), ...newEvent }])
    }

    return (
        <div className="flex h-screen w-full overflow-hidden">
            {/* Fixed sidebar */}
            <div className="w-56 flex-shrink-0">
                <Sidebar currentDate={currentDate} setCurrentDate={setCurrentDate} events={events} addEvent={addEvent} />
            </div>

            {/* Main content */}
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Fixed header */}
                <div className="flex-shrink-0">
                    <Header currentDate={currentDate} setCurrentDate={setCurrentDate} />
                </div>

                {/* Calendar grid */}
                <CalendarGrid currentDate={currentDate} events={events} setCurrentDate={setCurrentDate} />
            </div>
        </div>
    )
}