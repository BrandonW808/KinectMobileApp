import React, { Component } from 'react';
import { StyleSheet, Text, View, Picker} from 'react-native';
import axios from "axios";

const mode = require('../../mode.js');

export default class MemberAccountScreen extends Component {
  constructor(props){
    super(props);

    this.state = {
      email: "",
      password: "",
      loading: false,
      unlocked: false,
      error: false,
      mounted: false,
      mounted: false,
      gymSelected: this.props.member.registeredGyms[0],
      coords: {
        maxLat: undefined,
        minLat: undefined,
        maxLong: undefined,
        minLong: undefined,
      },
      membersPresent: undefined,
    }

    this.logout = this.logout.bind(this);
    this.getData = this.getData.bind(this);
  }

  componentDidMount(){
    this.setState({mounted: true});
  }

  getData(){
    if (this.props.session != undefined){
        let url = this.props.url + "/members/get/" + this.props.session.token + "/" + this.props.session.businessDB;
        axios.get(url).then((data) => {
          this.setState({member: data.data});
          let url = this.props.url + "/members/getMemberships/" + this.props.session.token + "/" + this.props.session.businessDB + "/" + this.state.member.email;
          axios.get(url).then((data) => {
            this.setState({memberships: data.data});
            let memberships = data.data;
            let resends = [];
            for (let i=0; i<data.data.length; i++){
              let resendData = {
                id: data.data[i].id,
                resendloading: false,
                resendfailed: false,
                resendsuccess: false,
              }
              resends.push(resendData);
            }
            if (memberships != undefined && memberships.length > 0){
              url = this.props.url + "/members/getNextBill/" + this.props.session.token + "/" + this.props.session.businessDB ;
              axios.get(url).then((data) => {
                for (let i=0; i<data.data.length; i++){
                  let billDate = new Date(data.data[i].billDate);
                  let nextBill = (data.data[i].amountDue/100) + " due on " + monthNames[billDate.getMonth()] + " " + (billDate.getDate()) + ", " + billDate.getFullYear();
                  for (let j=0; j<memberships.length; j++){
                    if (memberships[j].email == data.data[i].email){
                      memberships[j].bill = nextBill;
                      break;
                    }
                  }
                  this.setState({memberships: memberships});
                }
                this.render();
              }).catch((err) => {
                console.log("Couldn't retrieve next bill!");
              });
            }
            this.setState({resends: resends});
            window.scrollTo(0,0);
          });
          for (let i=0; i<this.props.gyms.length; i++){
            if (this.props.gyms[i]._id == this.state.member.registeredgym){
              console.log("Setting gym: " + JSON.stringify(this.props.gyms[i]));
              this.setState({gym: this.props.gyms[i]});
              this.render();
            }
          }
        }).catch((err) => {
          console.log(err);
          this.props.sessionHandler(undefined)
          this.props.history.push("/login");
        });
    }else{
        //TODO Login again
    }
  }

  logout(){
    this.props.memberHandler(undefined);
  }

  listGyms(){
    if (this.props.member.registeredGyms != undefined){
      return this.props.member.registeredGyms.map((gym) => {
        return (
          <Picker.Item key={gym.name} label={gym.name} value={gym} />
        );
      });
    }else{
      return (<p></p>);
    }
  }

  render(){
    return (
        <View style={styles.parent}>
            <View style={styles.container}>
                <Text style={styles.numberText}>My Account</Text>
                <Text>Next Bill: {this.state.nextBill}</Text>
            </View>
        </View>
    );
  }
}

const styles = StyleSheet.create({
  parent: {
    marginLeft: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  logout: {
    marginLeft: 10,
    marginRight: 10,
    marginTop: 50,
    alignItems: 'center',
  },
  picker: {
    height: 30,
    width: 300,
    alignItems: 'center',
  },
  button: {
    marginTop: 15,
    borderRadius: 4,
    alignItems: 'center',
  },
  selectButton: {
    height: 50,
    width: 300,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 4,
  },
  container: {
    width: 400,
    alignItems: 'center',
  },
  numberText: {
    fontSize: 30,
    alignItems: 'center',
  }
});
