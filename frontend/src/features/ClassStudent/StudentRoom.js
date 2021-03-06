/* eslint-disable react-hooks/rules-of-hooks */
import axios from 'axios';
import { OpenVidu } from 'openvidu-browser';
import React, { Component,createRef } from 'react';
import { Button, Box, Input,Image } from '@chakra-ui/react';
import "./scss/ClassStudent.scss"
import { withRouter } from 'react-router-dom';
import Toast from './components/Toast';
import UserVideoComponent from './openVidu/UserVideoComponent';
import Messages from './components/Messages';
import StudentModal from './components/StudentModal';

const quizDino = "https://cdn.discordapp.com/attachments/885744368399560725/940498039402037248/Pngtreecute_lively_green_little_dinosaur_4659657.png"
const OPENVIDU_SERVER_URL = 'https://i6e107.p.ssafy.io:8443';
const OPENVIDU_SERVER_SECRET = 'ssafy';

class StudentRoom extends Component {
  constructor(props) {
    super(props);
    const student = JSON.parse(localStorage.getItem('student'))
    this.state = {
      // OV
      session: undefined,
      mainStreamManager: undefined,
      publisher: undefined,
      subscribers: [],
      // TM
      student : student,
      messages: [],
      message: '',
      videostate: true,
      audiostate: false,
      highlighting: false,
      breaktime: false,
      mySessionId: 'ssafy' + (parseInt(student.roomGrade)*100 + parseInt(student.roomNum)),
      myUserName: student.studentName,

      //quiz
      studentsName:[],
      quizs:{},
      quizId: '',
      subject: '',
      quizPhoto: '',
      quizTitle: '',
      quizContents: '',
      quizAnswer: '',
      openStatus: true,
      quizTimeout: '',
      quizGrade: '',
      userId:'',
      option1:'',
      option2:'',
      option3:'',
      option4:'',
      pickone:'',
      results:[],
      studentAnswer:'',

    };

    // OV
    this.joinSession = this.joinSession.bind(this);
    this.leaveSession = this.leaveSession.bind(this);
    this.handleChangeSessionId = this.handleChangeSessionId.bind(this);
    this.handleChangeUserName = this.handleChangeUserName.bind(this);
    this.handleMainVideoStream = this.handleMainVideoStream.bind(this);
    this.onbeforeunload = this.onbeforeunload.bind(this);
    // ??????
    this.handleChatMessageChange = this.handleChatMessageChange.bind(this);
    this.messageContainer = createRef(null);
    this.sendmessageByEnter = this.sendmessageByEnter.bind(this);
    // TM
    this.handleHistory = this.handleHistory.bind(this)
    this.changeVideostate = this.changeVideostate.bind(this)
    this.changeAudiostate = this.changeAudiostate.bind(this)
    this.modalPop = this.modalPop.bind(this)

    // quiz
    //?????? ?????? ??????
  }


  // TM
  modalPop(kind) {
    this.props.modalOpen(kind)
  }
  changeVideostate() {
    this.state.publisher.publishVideo(!this.state.videostate);
    this.setState({
      videostate: !this.state.videostate
    })
  }

  changeAudiostate() {
    this.state.publisher.publishAudio(!this.state.audiostate);
    this.setState({
      audiostate: !this.state.audiostate
    })
  }

  handleHistory(path) {
    this.props.history.push(path)
  }


  // OV
  componentDidUpdate(previousProps, previousState) {
    if (this.refs.chatoutput != null) {
      this.refs.chatoutput.scrollTop = this.refs.chatoutput.scrollHeight;
      // this.setState({student:JSON.parse(localStorage.getItem('student'))}) 
    }
  } 
  componentDidMount() {
    window.addEventListener('beforeunload', this.onbeforeunload);
    this.leaveSession()
    this.props.setHeader(false)

  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onbeforeunload);
  }

  onbeforeunload(event) {
    this.leaveSession();
  }

  handleChangeSessionId(e) {
    this.setState({
      mySessionId: e.target.value,
    });
  }

  handleChatMessageChange(e) {
    this.setState({
      message: e.target.value,
    });
  }

  sendmessageByEnter(e) {
    if (e.key === 'Enter') {
      this.setState({
        messages: [
          ...this.state.messages,
          {
            userName: this.state.myUserName,
            text: this.state.message,
            role: 'student',
            chatClass: 'messages__item--operator',
          },
        ],
      });
      const mySession = this.state.session;

      mySession.signal({
        data: `${this.state.myUserName},${this.state.message}`,
        to: [],
        type: 'chat',
      });

      this.setState({
        message: '',
      });
    }
  }

  handleChangeUserName(e) {
    this.setState({
      myUserName: e.target.value,
    });
  }

  handleMainVideoStream(stream) {
    if (this.state.mainStreamManager !== stream) {
      this.setState({
        mainStreamManager: stream
      });
    }
  }

  deleteSubscriber(streamManager) {
    let subscribers = this.state.subscribers;
    let index = subscribers.indexOf(streamManager, 0);
    if (index > -1) {
      subscribers.splice(index, 1);
      this.setState({
        subscribers: subscribers,
      });
    }
  }

  //quiz ?????? ?????? ??????
  sendresultHandle(){
    const mySession = this.state.session
    mySession.signal({
      data:JSON.stringify({
        selectAnswer: localStorage.getItem('thisone'),
        studentId:this.state.student.studentId,
        quizId:sessionStorage.getItem('quizId'),
        studentResult:sessionStorage.getItem('studentResult')
      }),
      to:[],
      type:'studentQuizresult'
    })
    this.setState({
      studentAnswer:'',
      quizs:{}
    })
    sessionStorage.removeItem('studentResult')
    sessionStorage.removeItem('quizId')
  }

  
  joinSession() {
    this.OV = new OpenVidu();
    console.log("join!")
    this.setState(
      {
        session: this.OV.initSession(),
      },
      () => {

        let mySession = this.state.session;
        
        mySession.on('streamCreated', (event) => {

          let subscriber = mySession.subscribe(event.stream, undefined);
          let subscribers = this.state.subscribers;
          subscribers.push(subscriber);

          this.setState({
            subscribers: subscribers,
          });
        });
        // On every Stream destroyed...
        mySession.on('streamDestroyed', (event) => {
          // Remove the stream from 'subscribers' array
          this.deleteSubscriber(event.stream.streamManager);
        });
        // On every asynchronous exception...
        mySession.on('exception', (exception) => {
          console.warn(exception);
        });
        mySession.on('signal:chat', (event) => {
          let chatdata = event.data.split(',');
          if (chatdata[0] !== this.state.myUserName) {
            this.setState({
              messages: [
                ...this.state.messages,
                {
                  userName: chatdata[0],
                  text: chatdata[1],
                  chatClass: 'messages__item--visitor',
                },
              ],
            });
          }
        });
        
        // ?????? ???????????? ?????????
        mySession.on('signal:star',(event)=>{
          this.setState({
           student: {...this.state.student,
                    countingStar: this.state.student.countingStar +1,
                    studentScore : this.state.student.studentScore +1   }
          })
          mySession.signal({
            data:JSON.stringify({
              clientData: this.state.myUserName, 
              role:"student",
              studentId:this.state.student.studentId,
              countingStar: this.state.student.countingStar,
              studentScore : this.state.student.studentScore
            }),
            to:[],
            type:'receiveStar'
          })
        })
        // ??????????????????
        mySession.on('signal:rolling', (event) => {
          let data = event.data;
          let studentsName  = []
          this.state.subscribers.map(sub=> 
            {if(JSON.parse(sub.stream.connection.data).role ==="student")
            {studentsName.push(JSON.parse(sub.stream.connection.data).clientData)}
          })
          studentsName.push(this.state.myUserName)
          this.setState({
            studentsName:studentsName,
            pickone:data
          })
            this.modalPop('rolling')         
          });
        //quiz  
        //ox???
        mySession.on('signal:quiz', (event) => {
          let quizdata = JSON.parse(event.data);
            this.setState({
              quizs: 
                {
                  quizContents:quizdata.quizContents,
                  quizAnswer:quizdata.quizAnswer,
                  quizTimeout:quizdata.quizTimeout,
                  quizId:quizdata.quizId,
                  chatClass: 'quizs__item--visitor',
                },
            });   
            this.modalPop('oxQuiz')         
          });
        // ??????????????? Page
        mySession.on('signal:announcement', (event) => {  
            this.modalPop('announce')         
        });
          
        //????????? ??? quiz
        mySession.on('signal:bookmarkQuiz', (event) => {
        
          let quizdata = JSON.parse(event.data);
          this.setState({
            quizs:
              {
                quizId:quizdata.quizId,
                subject:quizdata.subject,
                quizPhoto:quizdata.quizPhoto,
                quizTitle:quizdata.quizTitle,
                quizContents:quizdata.quizContents,
                quizAnswer:quizdata.quizAnswer,
                openStatus:quizdata.openStatus,
                quizTimeout:quizdata.quizTimeout,
                quizGrade:quizdata.quizGrade,
                userId:quizdata.userId,
                option1:quizdata.options[0],
                option2:quizdata.options[1],
                option3:quizdata.options[2],
                option4:quizdata.options[3],

                chatClass: 'quizs__item--visitor',
              },       
          });
          // console.log(this.state.quizs)
          this.modalPop('quiz')
        });
        
        this.getToken().then((token) => {
          // console.log(this.state.student)
          mySession
            .connect(
              token,
              // ????????? ???????????? ????????? ??? !!!!
              { clientData: this.state.myUserName, 
                role:"student",
                studentId:this.state.student.studentId,
                countingStar: this.state.student.countingStar,
                studentScore : this.state.student.studentScore     // ??? ?????? ????????????
              },
            )
            .then(() => {
              let publisher = this.OV.initPublisher(undefined, {
                audioSource: undefined, // The source of audio. If undefined default microphone
                videoSource: undefined, // The source of video. If undefined default webcam
                publishAudio: false, // Whether you want to start publishing with your audio unmuted or not
                publishVideo: true, // Whether you want to start publishing with your video enabled or not
                resolution: '640x480', // The resolution of your video
                frameRate: 30, // The frame rate of your video
                insertMode: 'APPEND', // How the video is inserted in the target element 'video-container'
                mirror: true, // Whether to mirror your local video or not
              });
              mySession.publish(publisher);
              this.setState({
                mainStreamManager: publisher,
                publisher: publisher,
              });
            })
            .catch((error) => {
              console.log('There was an error connecting to the session:', error.code, error.message);
            });
          }
        );
      },
    );
  }

  leaveSession() {
    const mySession = this.state.session;
    if (mySession) {
      mySession.disconnect();
    }
    this.OV = null;
    this.setState({
      session: undefined,
      subscribers: [],
      mySessionId: 'ssafy' + (parseInt(this.state.student.roomGrade)*100 + parseInt(this.state.student.roomNum)),
      myUserName: this.state.student.studentName,
      mainStreamManager: undefined,
      publisher: undefined
    });
  }


  render() {
    const mySessionId = this.state.mySessionId;
    const myUserName = this.state.myUserName;
    const quizs = this.state.quizs;
    const micOn = 'https://cdn.discordapp.com/attachments/885744368399560725/940838592413057084/unknown.png'
    const micOff = 'https://cdn.discordapp.com/attachments/885744368399560725/940843036705959966/90b3c558d3543a12.png'
    const CamOn = "https://cdn.discordapp.com/attachments/885744368399560725/941232727225667594/07fcab7c699aa813.png"
    const CamOff = "https://cdn.discordapp.com/attachments/885744368399560725/941232721185873940/ffc10215d5c0b3bc.png"
    const teacherScreen = this.state.subscribers.filter(sub=> JSON.parse(sub.stream.connection.data).role ==="teacher" )
    return (
      <div className="ClassStudent">
        {/* ????????? ???????????? ??? */}
        {this.state.session === undefined && (
          <div className="join">
            <div className='student_login'>
              <div className='box'>
                <div className='left'>
                  <Image className='penguin' src="https://cdn.discordapp.com/attachments/885744368399560725/940498613614805022/be64e7a5abcb6882.png" />
                </div>
                <div className='right'> 
                  <div className='grade_room'>
                    
                    <form className="form-group" onSubmit={this.joinSession}>
                      <div>
                        <label className="label-control">?????? </label>
                        <input
                          className="form-control"
                          type="text"
                          id="userName"
                          value={myUserName}
                          onChange={this.handleChangeUserName}
                          required
                          disabled
                        />
                      </div>
                      <br/>
                      <div>
                        <label className="label-control"> ???????????? </label>
                        <input
                          className="form-control"
                          type="text"
                          id="sessionId"
                          value={mySessionId}
                          onChange={this.handleChangeSessionId}
                          required
                          disabled
                        />
                      </div>
                      <div className="btn_box">           
                          <Button colorScheme='linkedin' className="submit_button" type="submit" >????????????</Button>
                      </div>
                    </form>
                    
                    
                  </div>
                </div>
              </div>
            </div>  
          </div>
        )}

        {/* ????????? ????????? ??? */}
        {this.state.session !== undefined && (
          <Box className='Conference_box'>
              <div className='left'>
                {/* ?????? ?????? ?????????  */}
                  <div className='student_box'>
                    {this.state.publisher !== undefined && (
                      <div>
                        <UserVideoComponent who="student" streamManager={this.state.publisher} />
                      </div>
                    )}
                    {this.state.subscribers.map((sub, i) => {
                      if (JSON.parse(sub.stream.connection.data).role === "student") {
                        return (
                          <div key={i}>
                            <UserVideoComponent who="student" streamManager={sub} />
                          </div>
                        )
                      }
                    } )}
                  </div>
                  <div className='teacher_button_box'>
                    {/* ????????? ?????? */}
                    <div className='teacher_box'>
                      <UserVideoComponent who="teacher" streamManager={teacherScreen[0]} />
                    </div>
                    
                    {/* ????????? */}
                    <div className='center_button_box'>
                    
                    <StudentModal kind='sticker' iconAs={quizDino} title='?????????'  student={this.state.student}
                    isOpen={this.props.isOpen} onOpen={this.props.onOpen} onClose={this.props.onClose} modalForm={this.props.modalForm} setModalForm={this.props.setModalForm} modalOpen={this.props.modalOpen}
                    />
                    <div className='state_button' >
                      {this.state.videostate ? (
                        <Toast setState={this.changeVideostate} iconAs={CamOff} title='????????????'
                          change={false} message={'???????????? ????????????'} color={'white'} bg={'red.300'} />
                        ) : (
                        <Toast setState={this.changeVideostate} iconAs={CamOn} title='????????????'
                          change={true} message={'???????????? ????????????'} color={'white'} bg={'blue.300'} />
                      )}  
                    </div>
                    <div className='state_button'>
                      {this.state.audiostate ? (
                        <Toast setState={this.changeAudiostate} iconAs={micOff} title='????????????'
                          message={'???????????? ????????????'} color={'white'} bg={'orange.300'} />
                        ) : (
                        <Toast setState={this.changeAudiostate} iconAs={micOn} title='????????????'
                          message={'???????????? ????????????'} color={'white'} bg={'green.300'} />
                      )}
                    </div>
                  </div>
                </div>

              </div>
                <div className='right'>
                  <div className='right_up'>
                    <span className='grade_room'>{this.state.student.roomGrade}?????? {this.state.student.roomNum}???</span>
                    <Button className='exitButton' onClick={() => {
                      this.leaveSession()
                      this.handleHistory('/')
                      }}
                    >?????? ?????????</Button>
                  </div>
                {/* ?????? ?????? */}
                  <div className='chatting_box'>
                      <div className="chatting_log" ref="chatoutput" id='chatting_scroll'>
                        <Messages messages={this.state.messages} />
                      </div>
                      <Input
                        className='input_box'
                        id="chat_message"
                        type="text"
                        placeholder="??????"
                        onChange={this.handleChatMessageChange}
                        onKeyPress={this.sendmessageByEnter}
                        value={this.state.message}
                      />
                  </div> 
                  {this.state.audiostate ? <div className='warning'>???????????? ???????????????</div>:<div  className='warning' />}
                <StudentModal  kind='announce' iconAs="" title='????????????' 
                  isOpen={this.props.isOpen} onOpen={this.props.onOpen} onClose={this.props.onClose} modalForm={this.props.modalForm} 
                  setModalForm={this.props.setModalForm} modalOpen={this.props.modalOpen} />
                
                <StudentModal kind='quiz' quizs = {quizs}iconAs="" title='??????'
                  isOpen={this.props.isOpen} onOpen={this.props.onOpen} onClose={this.props.onClose} modalForm={this.props.modalForm} 
                  setModalForm={this.props.setModalForm} modalOpen={this.props.modalOpen}
                  mySession={this.state.session} student={this.state.student} 
                />

                <StudentModal kind='oxQuiz' quizs = {quizs} iconAs="" title='OX??????' 
                  isOpen={this.props.isOpen} onOpen={this.props.onOpen} onClose={this.props.onClose} modalForm={this.props.modalForm} 
                  setModalForm={this.props.setModalForm} modalOpen={this.props.modalOpen}
                  mySession={this.state.session} student={this.state.student}  />         

                <StudentModal kind='rolling'  iconAs="" title='??????' pickone={this.state.pickone} studentsName={this.state.studentsName}
                  isOpen={this.props.isOpen} onOpen={this.props.onOpen} onClose={this.props.onClose} modalForm={this.props.modalForm} 
                  setModalForm={this.props.setModalForm} modalOpen={this.props.modalOpen}
                  mySession={this.state.session} student={this.state.student}  /> 
                </div>
          </Box>
        )}
      </div>
    );
  }

  getToken() {
    return this.createSession(this.state.mySessionId).then((sessionId) => this.createToken(sessionId));
  }

  createSession(sessionId) {
    return new Promise((resolve, reject) => {
      let data = JSON.stringify({ customSessionId: sessionId });
      axios
        .post(OPENVIDU_SERVER_URL + '/openvidu/api/sessions', data, {
          headers: {
            Authorization: 'Basic ' + btoa('OPENVIDUAPP:' + OPENVIDU_SERVER_SECRET),
            'Content-Type': 'application/json',
          },
        })
        .then((response) => {
          console.log('CREATE SESION', response);
          resolve(response.data.id);
        })
        .catch((response) => {
          let error = Object.assign({}, response);
          if (error?.response?.status === 409) {
            resolve(sessionId);
          } else {
            console.log(error);
            console.warn(
              'No connection to OpenVidu Server. This may be a certificate error at ' +
              OPENVIDU_SERVER_URL,
            );
            if (
              window.confirm(
                'No connection to OpenVidu Server. This may be a certificate error at "' +
                OPENVIDU_SERVER_URL +
                '"\n\nClick OK to navigate and accept it. ' +
                'If no certificate warning is shown, then check that your OpenVidu Server is up and running at "' +
                OPENVIDU_SERVER_URL +
                '"',
              )
            ) {
              window.location.assign(OPENVIDU_SERVER_URL + '/accept-certificate');
            }
          }
        }
      );
    });
  }

  createToken(sessionId) {
    return new Promise((resolve, reject) => {
      let data = {};
      axios
        .post(OPENVIDU_SERVER_URL + "/openvidu/api/sessions/" + sessionId + "/connection", data, {
          headers: {
            Authorization: 'Basic ' + btoa('OPENVIDUAPP:' + OPENVIDU_SERVER_SECRET),
            'Content-Type': 'application/json',
          },
        })
        .then((response) => {
          console.log('TOKEN', response);
          resolve(response.data.token);
        })
        .catch((error) => reject(error));
      }
    );
  }
}

export default withRouter(StudentRoom);
