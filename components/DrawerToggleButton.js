import React from 'react';
import { View, StyleSheet } from "react-native";

const DrawerToggleButton = () => {
  <View style={styles.toggleButton} onClick={props.click} aria-label="Toggle Sidedrawer" >
    <View style={styles.toggleButtonLine}/>
    <View style={styles.toggleButtonLine}/>
    <View style={styles.toggleButtonLine}/>
  </View>
}

export default DrawerToggleButton;

const styles = StyleSheet.create({
  toggleButton: {
    height: '30px',
    width: '30px',
    display: 'flex',
    zIndex: 1004,
    flexDirection: 'column',
    justifyContent: 'space-around',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    paddingRight: '5%',
    boxSizing: 'border-box',
  },
  toggleButtonLine: {
    width: '30px',
    height: '3px',
    background: 'white',
  }
});