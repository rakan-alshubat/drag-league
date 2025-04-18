import React, { useEffect } from 'react'
import { useRouter } from "next/router";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react"
import LoadingWheel from "@/files/LoadingWheel";
import { SignInBox } from './AuthenticatorPage.styles'
import '@aws-amplify/ui-react/styles.css'

function AuthenticatorApp(){
    const router = useRouter();
    const { route } = useAuthenticator((context) => [context.route])

    useEffect(() => {
        if(route === 'authenticated'){
            router.replace('/Player')
        }
    }, [route, router]);
    return <LoadingWheel />
}

export default function AuthenticatorPage(){

    return (
        <SignInBox sx={{width:'100vw', height:'100vh'}}>
            <Authenticator >
                <AuthenticatorApp />
            </Authenticator>
        </SignInBox>
    )
}