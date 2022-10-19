import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';

const Header = () => {
  return (
    <View style={styles.parentView}>
      {/*<Icon style={styles.icon}
        name='menu'
        color='#fff'
        size={36}
         />   */}  
      <Image source={require('./../assets/logo.png')}
      style={styles.image}/>
      <View style={styles.spacer}/>
    </View>
  );
}

const styles = StyleSheet.create({
  parentView: {
    display: "flex",
    flex: 1,
    flexDirection: "row",
    justifyContent: 'center',
  },
  icon: {
    flex: 1,
    left: 5,
    top: 10,
    width: 50,
    justifyContent: 'center',
  },
  image: {
    top: 25,
    left: '60%',
    height: 70,
    flex: 2,
  },
  spacer: {
    flex: 1,
  }
});

export default Header;
