import React, { useState } from 'react';
import { useAppContext } from '../../libs/contextLib';
import { Button } from 'reactstrap';
import { useHistory } from 'react-router-dom';

export default function ChangePasswordPage() {
    const { userData, setStatus } = useAppContext(); 
    const history = useHistory();  
    
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    function validateForm() {
        return oldPassword.length > 0 && newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword;
    }

    function handleSubmit(event) {
        event.preventDefault();

        const fetch = require("node-fetch");
        const patchData = async () => {
            try {
                const signInResponse = await fetch(`/admin/signin?username=${userData.personalData.username}&&password=${oldPassword}`);
                if( signInResponse.status === 200 ) {
                    var body = {password: newPassword};

                    const passwordResponse = await fetch(`/admin/password/edit/${userData.personalData.username}`, {
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        method: 'PATCH',                                                              
                        body: JSON.stringify( body )                                 
                    });
                    if( passwordResponse.status === 200 ) {
                        setStatus('Password Successfully Changed.');
                        history.goBack();
                    }
                    else {
                        alert('Failed to update password. Please try again.');
                    }
                }
                else {
                    alert('Incorrect Password.');
                }
            }
            catch (error) {
                console.log(error);
            }
        }
        patchData();
        
    }


    return (
        <>
            <h1>Change Password</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    Old Password: <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
                    <br></br>
                    New Password: <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    <br></br>
                    Confirm New Password: <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    <br></br>
                </div>
                <br></br>
                <Button type="submit" disabled={!validateForm()}>Save</Button>
            </form>
        </>
    )
};