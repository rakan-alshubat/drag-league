import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import { serverLogWarn } from '@/helpers/serverLog';

/**
 * Countdown component that displays time remaining until a deadline
 * Automatically handles timezone conversion from UTC to user's local time
 * @param {string} deadline - ISO 8601 date string (UTC)
 * @param {string} label - Label to display above countdown
 * @param {boolean} showDate - Whether to show the full date/time
 * @param {boolean} compact - Whether to use compact inline styling
 * @param {string} leagueName - Name of the league for calendar event
 * @param {string} leagueUrl - URL of the league for calendar event
 */
export default function Countdown({ deadline, label = "Time Remaining", showDate = true, compact = false, leagueName = "Drag League", leagueUrl = "" }) {
    const [timeLeft, setTimeLeft] = useState(null);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (!deadline) return;

        const calculateTimeLeft = () => {
            const deadlineDate = new Date(deadline);
            const now = new Date();
            const difference = deadlineDate - now;

            if (difference <= 0) {
                setIsExpired(true);
                setTimeLeft(null);
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);

            setTimeLeft({ days, hours, minutes, seconds });
            setIsExpired(false);
        };

        // Calculate immediately
        calculateTimeLeft();

        // Update every second
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [deadline]);

    if (!deadline) {
        return null;
    }

    const formatLocalDate = () => {
        try {
            const deadlineDate = new Date(deadline);
            const dayName = deadlineDate.toLocaleDateString(undefined, { weekday: 'long' });
            const date = deadlineDate.toLocaleDateString(undefined, { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            });
            const time = deadlineDate.toLocaleTimeString(undefined, { 
                hour: 'numeric', 
                minute: '2-digit',
                timeZoneName: 'short'
            });
            return `${dayName}, ${date} at ${time}`;
        } catch (e) {
            return deadline;
        }
    };

    const formatTimeLeft = () => {
        if (isExpired) {
            return "Deadline has passed";
        }
        
        if (!timeLeft) {
            return "Loading...";
        }

        const parts = [];
        if (timeLeft.days > 0) parts.push(`${timeLeft.days}d`);
        if (timeLeft.hours > 0) parts.push(`${timeLeft.hours}h`);
        if (timeLeft.minutes > 0) parts.push(`${timeLeft.minutes}m`);
        if (timeLeft.seconds > 0 || parts.length === 0) parts.push(`${timeLeft.seconds}s`);
        
        return parts.join(' ');
    };

    const handleAddToCalendar = () => {
        try {
            const deadlineDate = new Date(deadline);
            const startDate = deadlineDate; // Start at deadline
            const endDate = new Date(deadlineDate.getTime() + 30 * 60 * 1000); // End 30 minutes later
            
            // Format dates for iCal (YYYYMMDDTHHMMSSZ)
            const formatICalDate = (date) => {
                return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            };

            // Generate unique ID for the event
            const uid = `${Date.now()}@dragleague.com`;
            const dtstamp = formatICalDate(new Date());
            
            // Determine event title based on compact mode
            const eventTitle = compact 
                ? `${leagueName} - Weekly Deadline`
                : `${leagueName} - Ranking Deadline`;

            const eventDescription = compact 
                ? `A Reminder to submit your weekly maxi challenge winner for this weeks ${leagueName} league!`
                : `A Reminder to submit your rankings for the league! ${leagueName} is waiting for you.`;

            const icsContent = [
                'BEGIN:VCALENDAR',
                'VERSION:2.0',
                'PRODID:-//Drag League//Calendar Event//EN',
                'BEGIN:VEVENT',
                `UID:${uid}`,
                `DTSTAMP:${dtstamp}`,
                `DTSTART:${formatICalDate(startDate)}`,
                `DTEND:${formatICalDate(endDate)}`,
                `SUMMARY:${eventTitle}`,
                `DESCRIPTION:${eventDescription}`,
                ...(leagueUrl ? [`URL:${leagueUrl}`, `LOCATION:${leagueUrl}`] : []),
                ...(compact ? ['RRULE:FREQ=WEEKLY'] : []),
                'BEGIN:VALARM',
                'TRIGGER:-PT3H',
                'ACTION:DISPLAY',
                `DESCRIPTION:${eventTitle} in 3 hours`,
                'END:VALARM',
                'END:VEVENT',
                'END:VCALENDAR'
            ].join('\r\n');

            const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = 'deadline-reminder.ics';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            serverLogWarn('Error creating calendar event:', error);
        }
    };

    if (compact) {
        return (
            <Box
                sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    padding: '8px 12px',
                    border: '1px solid',
                    borderColor: isExpired ? 'error.main' : 'primary.main',
                    borderRadius: 1.5,
                    backgroundColor: isExpired ? 'rgba(220,20,60,0.06)' : 'primary.light',
                    width: 'auto',
                    maxWidth: '100%',
                    textAlign: 'center',
                }}
            >
                <AccessTimeIcon fontSize="small" color={isExpired ? 'error' : 'primary'} />
                <Typography 
                    variant="body2" 
                    fontWeight="bold" 
                    color={isExpired ? 'error.main' : 'primary.dark'}
                    sx={{
                        fontFamily: 'monospace',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '100%'
                    }}
                >
                    {formatTimeLeft()}
                </Typography>
                {!isExpired && (
                    <Tooltip title="Add to Calendar" arrow>
                        <Box
                            onClick={handleAddToCalendar}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'primary.main',
                                borderRadius: '4px',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    color: 'primary.dark',
                                    transform: 'scale(1.1)',
                                }
                            }}
                        >
                            <EventIcon fontSize="small" />
                        </Box>
                    </Tooltip>
                )}
            </Box>
        );
    }

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: 2,
                border: '1px solid',
                borderColor: isExpired ? 'error.main' : 'primary.main',
                borderRadius: 2,
                backgroundColor: isExpired ? 'rgba(220,20,60,0.04)' : 'primary.light',
                margin: '16px 0',
                textAlign: 'center'
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AccessTimeIcon color={isExpired ? 'error' : 'primary'} />
                <Typography variant="subtitle2" fontWeight="bold" color={isExpired ? 'error.main' : 'primary'}>
                    {label}
                </Typography>
            </Box>
            
            <Typography 
                variant="h4" 
                fontWeight="bold" 
                color={isExpired ? 'error.main' : 'primary.dark'}
                sx={{ fontFamily: 'monospace', textAlign: 'center' }}
            >
                {formatTimeLeft()}
            </Typography>
            
            {showDate && !isExpired && (
                <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ mt: 1, textAlign: 'center' }}
                >
                    {formatLocalDate()}
                </Typography>
            )}

            {!isExpired && (
                <Tooltip title="Add reminder to your calendar" arrow>
                    <IconButton
                        onClick={handleAddToCalendar}
                        sx={{
                            mt: 2,
                            backgroundColor: 'primary.main',
                            color: 'white',
                            padding: '10px 20px',
                            borderRadius: 2,
                            '&:hover': {
                                backgroundColor: 'primary.dark',
                                transform: 'translateY(-2px)',
                                boxShadow: 2
                            },
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <EventIcon sx={{ mr: 1 }} />
                        <Typography variant="body2" fontWeight="600">
                            Add to Calendar
                        </Typography>
                    </IconButton>
                </Tooltip>
            )}
        </Box>
    );
}

Countdown.propTypes = {
    deadline: PropTypes.string,
    label: PropTypes.string,
    showDate: PropTypes.bool,
    compact: PropTypes.bool,
    leagueName: PropTypes.string,
    leagueUrl: PropTypes.string,
};
