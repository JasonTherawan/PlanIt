import { useState } from "react"
import TeamScheduleSidebar from "../components/team/TeamScheduleSidebar"
import CalendarGrid from "../components/main/CalendarGrid"
import MainHeader from "../components/main/MainHeader"
// import AddTeamModal from "../components/team/AddTeamModal"

function TeamsPage() {
  // State for currently selected date
  const [currentDate, setCurrentDate] = useState(new Date())

  // Teams data: list of teams with title, manager name, and profile picture URL
  const [teams, setTeams] = useState([
    {
      id: 1,
      title: "Marketing Team",
      managerName: "Alice Smith",
      managerProfilePic: "/images/alice.jpg",
    },
    {
      id: 2,
      title: "Development Team",
      managerName: "Bob Johnson",
      managerProfilePic: "/images/bob.jpg",
    },
  ])

  // Meetings data: list of meetings with title and time
  const [meetings, setMeetings] = useState([
    {
      id: 1,
      title: "Marketing Sync",
      start: new Date(2025, 1, 24, 9, 0),
      end: new Date(2025, 1, 24, 10, 0),
    },
    {
      id: 2,
      title: "Sprint Planning",
      start: new Date(2025, 1, 25, 14, 0),
      end: new Date(2025, 1, 25, 15, 30),
    },
  ])

  // Function to add a new meeting (to be implemented)
  const addMeeting = (newMeeting) => {
    setMeetings([...meetings, { id: Date.now(), ...newMeeting }])
  }

  // Function to add a new team (to be implemented)
  const addTeam = (newTeam) => {
    setTeams([...teams, { id: Date.now(), ...newTeam }])
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Fixed sidebar for Teams */}
      <div className="w-56 flex-shrink-0">
        <TeamScheduleSidebar
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          teams={teams}
          meetings={meetings}
          addTeam={addTeam}
          addMeeting={addMeeting}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Fixed header */}
        <div className="flex-shrink-0">
          <MainHeader currentDate={currentDate} setCurrentDate={setCurrentDate} />
        </div>

        {/* Calendar grid */}
        <CalendarGrid currentDate={currentDate} events={meetings} setCurrentDate={setCurrentDate} />

        {/* AddTeamModal usage commented until implemented */}
        {/*
        <AddTeamModal
          onClose={() => {
            // Close handler logic here
          }}
          // Pass any other necessary props here
        />
        */}
      </div>
    </div>
  )
}

export default TeamsPage