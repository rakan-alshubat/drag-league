import { CircularProgress } from '@mui/material'
import { LoadingWheelBox } from './LoadingWheel.styles'

export default function LoadingWheel(){

    return (
        <LoadingWheelBox sx={{width:'100vw', height:'100vh'}}>
            <CircularProgress 
                size={150}
                thickness={4}
                sx={{color:'#FFD700'}}
            />
        </LoadingWheelBox>
    )
}