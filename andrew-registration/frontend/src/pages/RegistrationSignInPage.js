import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAppContext } from '../libs/contextLib';
import { Button } from 'reactstrap';
import { sha256 } from 'js-sha256';

export default function SignIn() {
    const { isAuthenticated, userHasAuthenticated, userData, setUserData } = useAppContext();
    const history = useHistory();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    function validateForm() {
        return username.length > 0 && password.length > 0;
    }

    function handleSubmit(event) {
        event.preventDefault();

        const fetch = require("node-fetch");
        const fetchData = async () => {
            try {
                // fetch signin data from psql database
                const signInResponse = await fetch(`/signin/username/${username}/password/${password}`);
                var hash = await signInResponse.json();
                console.log(hash);
                const pass_salt = password + hash[0].password_salt;
                // ensure password is valid
                if(sha256(pass_salt) === hash[0].password_hash) {
                    // fetch personal user data to be displayed in Registration Home Page and Registration SideBar
                    const userPersonalDataResponse = await fetch(`/userdata/${hash[0].person_id}`);
                    var userPersonalData = await userPersonalDataResponse.json();
                    setUserData({...userData, 
                        person: {
                            chineseName: userPersonalData[0].chinese_name,
                            englishName: `${userPersonalData[0].english_first_name} ${userPersonalData[0].english_last_name}`,
                            gender: userPersonalData[0].gender,
                            birthMonthYear: `${userPersonalData[0].birth_month}/${userPersonalData[0].birth_year}`,
                            nativeLanguage: userPersonalData[0].native_language,
                            address: `${userPersonalData[0].street}, ${userPersonalData[0].city}, ${userPersonalData[0].state} ${userPersonalData[0].zipcode}`,
                            homePhone: userPersonalData[0].home_phone,
                            cellPhone: userPersonalData[0].cell_phone,
                            email: userPersonalData[0].email
                        }
                    });
                    userHasAuthenticated(true);
                    // redirect to registration homepage
                    history.push('/registration');
                }
                else {
                    alert("Sign In Failed");
                }
            } catch (error) {
                console.log(error);
            }
        }
        fetchData();
    }
    
    return (
        <>
            <h1>Please Sign In</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    Username: <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
                    <br></br>
                    Password: <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <br></br>
                <Button type="signin" disabled={!validateForm()}>Sign In</Button>
            </form>
        </>
    )
};