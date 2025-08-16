import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getCurrentUser, signOut } from "aws-amplify/auth";
import LoadingWheel from "@/files/LoadingWheel";
import { Button } from "@mui/material";

export default function player(){
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getCurrentUser()
      .then(user => {
        setLoading(false)
        console.log(user)
      })
      .catch(() => {
        router.push('/signin')
      });
  }, []);

  const handleSignOut = async () => {
    try{
        await signOut()
        router.push('/')
    } catch (error) {
        console.error('Could not sign out')
    }
  }

  if(loading){
    return (
      <LoadingWheel />
    )
  }

  return (
    <>
        yes <Button onClick={handleSignOut}> sign out</Button>
    </>
  );
}