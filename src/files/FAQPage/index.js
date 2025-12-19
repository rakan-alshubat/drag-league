import { useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { faqData } from '@/data/faqData';
import {
    PageContainer,
    PageTitle,
    PageSubtitle,
    CategorySection,
    CategoryTitle,
    StyledAccordion,
    StyledAccordionSummary,
    QuestionText,
    StyledAccordionDetails,
    AnswerText
} from './FAQPage.styles';

export default function FAQPage() {
    const [expanded, setExpanded] = useState(false);

    const handleChange = (panel) => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };

    return (
        <PageContainer>
            <PageTitle>Frequently Asked Questions</PageTitle>
            <PageSubtitle>
                Find answers to common questions about Drag League
            </PageSubtitle>

            {faqData.map((category, categoryIndex) => (
                <CategorySection key={categoryIndex}>
                    <CategoryTitle>{category.category}</CategoryTitle>
                    
                    {category.questions.map((faq, faqIndex) => {
                        const panelId = `panel-${categoryIndex}-${faqIndex}`;
                        
                        return (
                            <StyledAccordion
                                key={faqIndex}
                                expanded={expanded === panelId}
                                onChange={handleChange(panelId)}
                            >
                                <StyledAccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    aria-controls={`${panelId}-content`}
                                    id={`${panelId}-header`}
                                >
                                    <QuestionText>{faq.question}</QuestionText>
                                </StyledAccordionSummary>
                                <StyledAccordionDetails>
                                    <AnswerText>{faq.answer}</AnswerText>
                                </StyledAccordionDetails>
                            </StyledAccordion>
                        );
                    })}
                </CategorySection>
            ))}
        </PageContainer>
    );
}
