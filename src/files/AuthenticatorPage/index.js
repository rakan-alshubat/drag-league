import React, { useEffect } from 'react'
import { useWindowSize } from 'react-use'
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
    const { width, height } = useWindowSize()

    return (
        <SignInBox sx={{width:width, height:height}}>
            <Authenticator >
                <AuthenticatorApp />
            </Authenticator>
        </SignInBox>
    )
}