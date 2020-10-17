import React, { useState } from 'react';
import { useAppContext } from '../../libs/contextLib';
import "react-credit-cards/es/styles-compiled.css";
import { Button } from 'reactstrap';

export default function PaymentForm(props) {
    const { registerInfo, schoolYear, status, setStatus, userData } = useAppContext(); 

    const [cardInfo, setCardInfo] = useState({
        cvc: '',
        expiryMonth: '',
        expiryYear: '',
        number: ''
    });

    const validateForm = () => {
        return cardInfo.cvc !== '' && cardInfo.expiryMonth !== '' && cardInfo.expiryYear !== '' && cardInfo.number !== '';
    };

    const createRegistrationPreferences = async (pref) => {
        try {
            const postResponse = await fetch('/registration/preference/add', {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                method: 'POST',                                                              
                body: JSON.stringify( pref )                                        
            })
            if(postResponse.status !== 201) {
                alert('Failed to add registration preference. Please try again.');
            }
        }
        catch(error) {
            console.log(error);
        }
    } 

    const createRegistrationPayment = async () => {
        var body = {
            school_year_id: schoolYear.id,
            paid_by_id: userData.personalData.personId,
            pva_due_in_cents: props.pvaMembershipDueInCents,
            ccca_due_in_cents: props.cccaMembershipDueInCents,
            grand_total_in_cents: props.totalPaymentInCents,
            paid: false,
            request_in_person: false
        }
        try {
            const postResponse = await fetch('/registration/payment/add', {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                method: 'POST',                                                              
                body: JSON.stringify( body )                                        
            })
            if(postResponse.status !== 201) {
                alert('Failed to add registration payment. Please try again.');
            }
        }
        catch(error) {
            console.log(error);
        }
    } 

    const handleInputChange = (e) => {
        setCardInfo({
            ...cardInfo,
            [e.target.name]: e.target.value
        });
    };

    function createSelectItems() {
        var items = [];
        var year = parseInt(schoolYear.start_date.split('-')[0], 10);
        var i = 0;
        items.push(<option key={i++} value={""}></option>)
        for(; i < 11; i++) {
            items.push(<option key={i} value={year+i}>{year+i}</option>);
        }      
        return items;
    };

    function handleSubmit(e) {
        e.preventDefault();

        // User enters credit card information into the application
        // Credit card information is sent to the Payment Gateway via a secure channel
        // The Payment Gateway routes the credit card to the appropriate Internet Merchant Account
        // Internet Merchant Account connects to the Merchant Account for credit card processing.
        // The result is passed back to the Gateway and then the application.

        if(cardInfo.number[0].localeCompare('5') === 0 || cardInfo.number[0].localeCompare('4') === 0) {
            // var transactionGatewayResult = processTransaction(cardInfo);
            // if(transactionGatewayResult.status === 'Accept') {
            //      create gateway transaction entry
            //      create student fee payment entry
            //      create registration payment entry
            //      send confirmation email
            // }
            // else {
            //      create gateway transaction entry
            // }
            registerInfo.studentPreferences.forEach((pref) => createRegistrationPreferences(pref));
            registerInfo.studentsToRegiser.forEach((student) => createStudentFeePayment(student));
            createRegistrationPayment();
            
            console.log(cardInfo.cvc, cardInfo.expiryMonth, cardInfo.expiryYear, cardInfo.number);
        }
        else {
            setStatus('Only Visa and Mastercard are accepted.');
        }
    }

    return (
        <>
            <p id="status">{status}</p>
            <div id="PaymentForm">
                <form onSubmit={handleSubmit}>
                    <div>
                        <input
                            type='text'
                            name='number'
                            placeholder='Card Number'
                            onChange={handleInputChange}
                        />
                    </div>
                    <div>
                        <select id="month" name="expiryMonth" onChange={handleInputChange}>
                            <option value=""></option>
                            <option value="01">1</option>
                            <option value="02">2</option>
                            <option value="03">3</option>
                            <option value="04">4</option>
                            <option value="05">5</option>
                            <option value="06">6</option>
                            <option value="07">7</option>
                            <option value="08">8</option>
                            <option value="09">9</option>
                            <option value="10">10</option>
                            <option value="11">11</option>
                            <option value="12">12</option>
                        </select>
                        <select id="year" name="expiryYear" onChange={handleInputChange}>
                            {createSelectItems()}
                        </select>
                    </div>
                    <div>
                        <input type='text' name='cvc' placeholder='CVC' maxLength='3' size='4' onChange={handleInputChange}/>
                    </div>
                    <Button type='submit' disabled={!validateForm()}>Submit Payment</Button>
                </form>
            </div>
        </>
    )
}