import { Box, Container, Typography, Paper, List, ListItem, ListItemText, Divider, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const TermsOfService = () => {
    const navigate = useNavigate();
    const lastUpdated = "January 6, 2026";
    const companyName = "Shia's Transportation";
    const appName = "Shia's Transportation";
    const contactEmail = "contact@shiastransport.com";
    const websiteUrl = "https://www.shiastransportation.com";

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', py: 4 }}>
            <Container maxWidth="md">
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/')}
                    sx={{ mb: 3 }}
                >
                    Back to Home
                </Button>

                <Paper elevation={3} sx={{ p: { xs: 3, md: 5 } }}>
                    <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                        Terms of Service
                    </Typography>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Last Updated: {lastUpdated}
                    </Typography>

                    <Divider sx={{ my: 3 }} />

                    {/* Agreement to Terms */}
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mt: 3 }}>
                        1. Agreement to Terms
                    </Typography>
                    <Typography paragraph>
                        By accessing or using {appName}'s services, including our mobile applications and web
                        platforms, you agree to be bound by these Terms of Service ("Terms"). If you do not
                        agree to these Terms, you may not access or use our services.
                    </Typography>
                    <Typography paragraph>
                        These Terms apply to all users of our services, including drivers, dispatchers, and
                        passengers who interact with our transportation platform.
                    </Typography>

                    {/* Description of Services */}
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mt: 4 }}>
                        2. Description of Services
                    </Typography>
                    <Typography paragraph>
                        {companyName} provides a transportation dispatch platform that connects passengers with
                        drivers through our dispatcher network. Our services include:
                    </Typography>
                    <List dense>
                        <ListItem>
                            <ListItemText primary="Mobile application for drivers to receive and manage ride assignments" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Web-based dashboard for dispatchers to coordinate rides" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Real-time communication between drivers and dispatchers" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Payment processing for transportation services" />
                        </ListItem>
                    </List>

                    {/* User Accounts */}
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mt: 4 }}>
                        3. User Accounts
                    </Typography>
                    <Typography paragraph>
                        To use certain features of our services, you must create an account. You agree to:
                    </Typography>
                    <List dense>
                        <ListItem>
                            <ListItemText primary="Provide accurate and complete information during registration" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Maintain the security of your account credentials" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Notify us immediately of any unauthorized access to your account" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Accept responsibility for all activities that occur under your account" />
                        </ListItem>
                    </List>
                    <Typography paragraph>
                        We reserve the right to suspend or terminate accounts that violate these Terms or
                        engage in fraudulent or illegal activities.
                    </Typography>

                    {/* Driver Requirements */}
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mt: 4 }}>
                        4. Driver Requirements
                    </Typography>
                    <Typography paragraph>
                        Drivers using our platform must:
                    </Typography>
                    <List dense>
                        <ListItem>
                            <ListItemText primary="Possess a valid driver's license appropriate for the vehicle operated" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Maintain valid vehicle registration and insurance" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Keep the vehicle in safe operating condition" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Comply with all applicable local, state, and federal laws" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Enable location services while actively accepting rides" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Provide professional and courteous service to passengers" />
                        </ListItem>
                    </List>

                    {/* Acceptable Use */}
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mt: 4 }}>
                        5. Acceptable Use
                    </Typography>
                    <Typography paragraph>
                        You agree not to:
                    </Typography>
                    <List dense>
                        <ListItem>
                            <ListItemText primary="Use our services for any unlawful purpose" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Interfere with or disrupt the operation of our services" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Attempt to gain unauthorized access to our systems" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Impersonate another person or entity" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Share your account credentials with others" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Use automated systems to access our services without permission" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Harass, threaten, or discriminate against other users" />
                        </ListItem>
                    </List>

                    {/* Payments and Fees */}
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mt: 4 }}>
                        6. Payments and Fees
                    </Typography>
                    <Typography paragraph>
                        Payment for transportation services is processed through Square, Inc. By using our
                        payment services, you agree to Square's terms of service. Fare amounts are determined
                        based on factors including distance, time, and vehicle type.
                    </Typography>
                    <Typography paragraph>
                        Drivers receive compensation for completed rides according to the payment terms
                        established with {companyName}. We reserve the right to modify payment structures
                        with reasonable notice.
                    </Typography>
                    <Typography paragraph>
                        Cancellation fees may apply for rides cancelled after a driver has been assigned,
                        as determined by our cancellation policy.
                    </Typography>

                    {/* Intellectual Property */}
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mt: 4 }}>
                        7. Intellectual Property
                    </Typography>
                    <Typography paragraph>
                        All content, features, and functionality of our services, including but not limited
                        to text, graphics, logos, and software, are owned by {companyName} and are protected
                        by copyright, trademark, and other intellectual property laws.
                    </Typography>
                    <Typography paragraph>
                        You are granted a limited, non-exclusive, non-transferable license to use our
                        applications for their intended purpose. You may not copy, modify, distribute, or
                        reverse engineer any part of our services.
                    </Typography>

                    {/* Disclaimers */}
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mt: 4 }}>
                        8. Disclaimers
                    </Typography>
                    <Typography paragraph>
                        OUR SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
                        EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT OUR SERVICES WILL BE UNINTERRUPTED,
                        ERROR-FREE, OR COMPLETELY SECURE.
                    </Typography>
                    <Typography paragraph>
                        {companyName} is a technology platform that connects drivers with passengers through
                        dispatchers. We are not a transportation carrier and do not provide transportation
                        services directly. Drivers are independent contractors, not employees of {companyName}.
                    </Typography>

                    {/* Limitation of Liability */}
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mt: 4 }}>
                        9. Limitation of Liability
                    </Typography>
                    <Typography paragraph>
                        TO THE MAXIMUM EXTENT PERMITTED BY LAW, {companyName.toUpperCase()} SHALL NOT BE LIABLE
                        FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING
                        BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
                    </Typography>
                    <List dense>
                        <ListItem>
                            <ListItemText primary="Your use or inability to use our services" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Any conduct or content of third parties on our services" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Unauthorized access to or alteration of your data" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Any transportation services provided by drivers" />
                        </ListItem>
                    </List>

                    {/* Indemnification */}
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mt: 4 }}>
                        10. Indemnification
                    </Typography>
                    <Typography paragraph>
                        You agree to indemnify and hold harmless {companyName}, its officers, directors,
                        employees, and agents from any claims, damages, losses, liabilities, and expenses
                        (including attorney's fees) arising out of your use of our services, your violation
                        of these Terms, or your violation of any rights of another party.
                    </Typography>

                    {/* Termination */}
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mt: 4 }}>
                        11. Termination
                    </Typography>
                    <Typography paragraph>
                        We may terminate or suspend your account and access to our services at any time,
                        with or without cause or notice. Upon termination, your right to use our services
                        will immediately cease.
                    </Typography>
                    <Typography paragraph>
                        You may terminate your account at any time by contacting us. Termination does not
                        relieve you of any obligations incurred prior to termination.
                    </Typography>

                    {/* Governing Law */}
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mt: 4 }}>
                        12. Governing Law
                    </Typography>
                    <Typography paragraph>
                        These Terms shall be governed by and construed in accordance with the laws of the
                        State of New York, without regard to its conflict of law provisions. Any disputes
                        arising from these Terms shall be resolved in the courts located in New York.
                    </Typography>

                    {/* Changes to Terms */}
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mt: 4 }}>
                        13. Changes to Terms
                    </Typography>
                    <Typography paragraph>
                        We reserve the right to modify these Terms at any time. We will notify users of
                        material changes by posting the updated Terms on our website and updating the
                        "Last Updated" date. Your continued use of our services after such changes
                        constitutes acceptance of the new Terms.
                    </Typography>

                    {/* Severability */}
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mt: 4 }}>
                        14. Severability
                    </Typography>
                    <Typography paragraph>
                        If any provision of these Terms is found to be unenforceable or invalid, that
                        provision shall be limited or eliminated to the minimum extent necessary, and the
                        remaining provisions shall remain in full force and effect.
                    </Typography>

                    {/* Contact Information */}
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mt: 4 }}>
                        15. Contact Information
                    </Typography>
                    <Typography paragraph>
                        If you have any questions about these Terms, please contact us:
                    </Typography>
                    <List dense>
                        <ListItem>
                            <ListItemText primary={`Email: ${contactEmail}`} />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary={`Website: ${websiteUrl}`} />
                        </ListItem>
                    </List>

                    <Divider sx={{ my: 4 }} />

                    <Typography variant="body2" color="text.secondary" align="center">
                        © 2024 {companyName}. All rights reserved.
                    </Typography>
                </Paper>
            </Container>
        </Box>
    );
};

export default TermsOfService;
