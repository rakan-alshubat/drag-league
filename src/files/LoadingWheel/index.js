import { useWindowSize } from 'react-use'
import { CircularProgress, colors } from '@mui/material'
import { LoadingWheelBox } from './LoadingWheel.styles'

export default function LoadingWheel(){
    const { width, height } = useWindowSize()

    return (
        <LoadingWheelBox sx={{width:width, height:height}}>
            <CircularProgress 
                size={150}
                sx={{color:'black'}}
            />
        </LoadingWheelBox>
    )
}