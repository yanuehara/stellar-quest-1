const { Server, Keypair, TransactionBuilder, BASE_FEE, Networks, Operation } = require('stellar-sdk')
const parseError = require('@runkit/tyvdh/parse-error/2.0.0')

try {
    const server = new Server('https://horizon-testnet.stellar.org')
    const myPublicKey = 'GAHS7PXX7RNC2IVVPCP5GC26EQAFW3G4BQHGB2ZTHYQPBDHNA2RKCAUY'
    
    try {
        await server.loadAccount(myPublicKey)
        console.log('Your account has already been successfully created!')
    }
    
    catch(err) {
        const friendbotKeypair = Keypair.random()
        const friendbotPublicKey = friendbotKeypair.publicKey()

        await server
        .friendbot(friendbotPublicKey)
        .call()
        .then(() => {
            console.log('Random friendbot account was successfully funded')
            return server.loadAccount(friendbotPublicKey)
        })
        .then((account) => {
            const transaction = new TransactionBuilder(account, {
                fee: BASE_FEE,
                networkPassphrase: Networks.TESTNET
            })
            .addOperation(Operation.createAccount({
                destination: myPublicKey,
                startingBalance: '1000'
            }))
            .setTimeout(0)
            .build()

            transaction.sign(friendbotKeypair)

            console.log('Create account transaction has been prepared and signed')
            return server.submitTransaction(transaction)
        })
        .then(() => {
            console.log('Create account transaction was successfully submitted')
            return server.loadAccount(myPublicKey)
        })
        .then(() => console.log('Your account has been successfully created!'))
    }
}

catch(err) {
    console.error(parseError(err))
}
