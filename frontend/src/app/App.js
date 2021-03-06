import 'bootstrap/dist/css/bootstrap.min.css';
import {Route,Switch} from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css';
import { ChakraProvider, useDisclosure } from '@chakra-ui/react'
import './App.scss'
import TeacherApp from './TeacherApp';
import { useEffect, useState } from 'react';
import MainPage from '../features/mainpage/MainPage';
import StudentRoom from '../features/ClassStudent/StudentRoom';
import StudentLogin from '../features/ClassStudent/StudentLogin';


function App() {
  const [header,setHeader] =useState(true)
  const [student,setStudent] = useState({})
  const { isOpen, onOpen, onClose, onToggle } = useDisclosure()
  const [modalForm, setModalForm] = useState(null)
  const modalOpen = (kind) => {
    setModalForm(kind)
    onOpen()
  }
  return (
    <div className='App'>
      <ChakraProvider>
        <TeacherApp header={header} setHeader={setHeader}/>
        <Switch> 
          {/* 헤더 안쓰는 곳 */}
          <Route path="/"   exact render={()=><MainPage setHeader={setHeader} />}/>
          <Route path="/class/student/login" exact render={(props)=><StudentLogin setHeader={setHeader} student={student} setStudent={setStudent} />}/>
          <Route path="/class/student" exact render={()=><StudentRoom setHeader={setHeader} student={student} setStudent={setStudent}
            isOpen={isOpen} onOpen={onOpen} onClose={onClose} modalForm={modalForm} setModalForm={setModalForm} modalOpen={modalOpen} />}/>        </Switch>
      </ChakraProvider>
    </div>
  );
}

export default App;
