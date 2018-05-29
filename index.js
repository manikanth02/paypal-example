const express = require('express');
const bodyparser = require('body-parser');
const paypal = require('paypal-rest-sdk');
const url = require('url');

const app = express();

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'YOUR KEY',
    'client_secret': 'YOUR SECRET'
});

app.use(express.static('public'));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded());

app.get('/', (req, res) => res.send("Hello World!"));

app.post('/payment', (req, res) => {

    var isoDate = new Date();
    isoDate.setSeconds(isoDate.getSeconds() + 4);
    isoDate.toISOString().slice(0, 19) + 'Z';

    var billingPlanAttributes = {
        "description": "Create Plan for Regular",
        "merchant_preferences": {
            "auto_bill_amount": "yes",
            "cancel_url": "http://www.cancel.com",
            "initial_fail_amount_action": "continue",
            "max_fail_attempts": "1",
            "return_url": "http://www.success.com",
            "setup_fee": {
                "currency": "USD",
                "value": "25"
            }
        },
        "name": "Testing1-Regular1",
        "payment_definitions": [{
                "amount": {
                    "currency": "USD",
                    "value": "100"
                },
                "charge_models": [{
                        "amount": {
                            "currency": "USD",
                            "value": "10.60"
                        },
                        "type": "SHIPPING"
                    },
                    {
                        "amount": {
                            "currency": "USD",
                            "value": "20"
                        },
                        "type": "TAX"
                    }
                ],
                "cycles": "0",
                "frequency": "Day",
                "frequency_interval": "1",
                "name": "Regular 1",
                "type": "REGULAR"
            },
            {
                "amount": {
                    "currency": "USD",
                    "value": "20"
                },
                "charge_models": [{
                        "amount": {
                            "currency": "USD",
                            "value": "10.60"
                        },
                        "type": "SHIPPING"
                    },
                    {
                        "amount": {
                            "currency": "USD",
                            "value": "20"
                        },
                        "type": "TAX"
                    }
                ],
                "cycles": "4",
                "frequency": "Day",
                "frequency_interval": "1",
                "name": "Trial 1",
                "type": "TRIAL"
            }
        ],
        "type": "INFINITE"
    };

    var billingPlanUpdateAttributes = [{
        "op": "replace",
        "path": "/",
        "value": {
            "state": "ACTIVE"
        }
    }];

    var billingAgreementAttributes = {
        "name": "Fast Speed Agreement",
        "description": "Agreement for Fast Speed Plan",
        "start_date": isoDate,
        "plan": {
            "id": "P-8DC161200Y459752CVYTWZIY"
        },
        "payer": {
            "payment_method": "paypal"
        }
    };

    // Create the billing plan
    paypal.billingPlan.create(billingPlanAttributes, function (error, billingPlan) {
        if (error) {
            console.log(error);
            throw error;
        } else {
            paypal.billingAgreement.create(billingAgreementAttributes, function (error, billingAgreement) {
                if (error) {
                    console.log(error);
                    throw error;
                } else {
                    console.log("Create Billing Agreement Response");
                    //console.log(billingAgreement);
                    for (var index = 0; index < billingAgreement.links.length; index++) {
                        if (billingAgreement.links[index].rel === 'approval_url') {
                            var approval_url = billingAgreement.links[index].href;
                            console.log("For approving subscription via Paypal, first redirect user to");
                            console.log(approval_url);

                            console.log("Payment token is");
                            var token = url.parse(approval_url, true).query.token;
                            console.log(token);
                            res.json({token:token});
                        }
                    }
                }
            });
        }
    });





});

app.post('/execute', (req, res) => {
    paypal.billingAgreement.execute(req.body.paymentID,{},(err,bg) => {
        if(err){
            console.log(err);            
            res.status(500).send(err);
        }else{
            console.log(bg);
            res.json(bg);    
        }
    });
});


app.listen(3000, () => console.log("app running on port 3000"));