import React from 'react'
import style from "./ToggleButtons.module.css";

export default function ToggleButtons({checked, onChange, value}: any) {
        console.log("volv",value)
  return (
        <fieldset id="switch" className={style.radio}>
            <input name="switch" id="on" type="radio" checked={checked}  value={value}/>
            <label htmlFor="on">include</label>
            <input checked={true} name="switch" id="off" type="radio" value={value}/>
            <label  htmlFor="off">Disclude</label>
            
        </fieldset>
    )
}