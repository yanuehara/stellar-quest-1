const { Server, Keypair, TransactionBuilder, BASE_FEE, Networks, Operation } = require('stellar-sdk')
const parseError = require('@runkit/tyvdh/parse-error/2.0.0')

try {
    const server = new Server('https://horizon-testnet.stellar.org')
    
    const myKeypair = Keypair.fromSecret('SBWHGXDQH4BQIBI56E6CPIF56NW7PZX7LKMLPC2OOKSUDJJVSL7GJBT3')
    const myPublicKey = myKeypair.publicKey()
    
    await server.loadAccount(myPublicKey)
    .then(async (account) => {
        if (account.signers.length > 1)
            return console.log('Your account has already successfully added multisig')
    
        console.log('Account exists and is ready to add then use multisig')
    
        const multisigKeypair = Keypair.random()
        const multisigPublicKey = multisigKeypair.publicKey()
    
        const transaction1 = new TransactionBuilder(account, {
            fee: BASE_FEE,
            networkPassphrase: Networks.TESTNET
        })
        .addOperation(Operation.setOptions({
            masterWeight: 1,
            lowThreshold: 1,
            medThreshold: 1,
            highThreshold: 1,
            signer: {
                ed25519PublicKey: multisigPublicKey,
                weight: 1
            }
        }))
        .setTimeout(0)
        .build()

        transaction1.sign(myKeypair)

        console.log('Add multisig transaction has been prepared and signed')
        await server.submitTransaction(transaction1)
        console.log('Add multisig transaction was successfully submitted')
        
        const transaction2 = new TransactionBuilder(account, {
            fee: BASE_FEE,
            networkPassphrase: Networks.TESTNET
        })
        .addOperation(Operation.bumpSequence({
            bumpTo: '0'
        }))
        .setTimeout(0)
        .build()
        
        transaction2.sign(multisigKeypair)

        console.log('Use multisig transaction has been prepared and signed')
        await server.submitTransaction(transaction2)
        console.log('Use multisig transaction was successfully submitted')
    })
}

catch(err) {
    console.error(parseError(err))
}
