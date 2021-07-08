import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';

const Header = () => {
  return (
    <View >
      <Image source={require('./../assets/logo.png')}
      style={{
        top: 15,
        width: 180,
        height: 70,
      }}/>
    </View>
  );
}


export default Header;
