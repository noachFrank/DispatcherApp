import { Box, Container, Typography, Paper, List, ListItem, ListItemText, Divider, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
    const navigate = useNavigate();
    const lastUpdated = "January 6, 2026";
    const companyName = "Shia's Transportation";
    const appName = "Shia's Transportation Driver App";
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
                        Privacy Policy
                    </Typography>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Last Updated: {lastUpdated}
                    </Typography>

                    <Divider sx={{ my: 3 }} />

                    {/* Introduction */}
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mt: 3 }}>
                        Introduction
                    </Typography>
                    <Typography paragraph>
                        {companyName} ("we," "our," or "us") operates the {appName} mobile application
                        and the dispatcher web dashboard. This Privacy Policy explains how we collect, use,
                        disclose, and safeguard your information when you use our services.
                    </Typography>
                    <Typography paragraph>
                        Please read this Privacy Policy carefully. By using our services, you agree to the
                        collection and use of information in accordance with this policy.
                    </Typography>

                    {/* Information We Collect */}
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mt: 4 }}>
                        Information We Collect
                    </Typography>

                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                        Personal Information
                    </Typography>
                    <Typography paragraph>
                        We collect personal information that you voluntarily provide when registering for
                        our services, including:
                    </Typography>
                    <List dense>
                        <ListItem>
                            <ListItemText primary="Name and contact information (email address, phone number)" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Login credentials (username and password)" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Vehicle information (for drivers)" />
                        </ListItem>
                    </List>

                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                        Location Data
                    </Typography>
                    <Typography paragraph>
                        <strong>For Drivers:</strong> We collect real-time GPS location data when you are
                        logged into the Driver App. This information is essential for:
                    </Typography>
                    <List dense>
                        <ListItem>
                            <ListItemText primary="Allowing dispatchers to assign rides efficiently" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Providing accurate ETAs to passengers" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Navigation and route optimization" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Safety and service quality monitoring" />
                        </ListItem>
                    </List>
                    <Typography paragraph>
                        You can disable location tracking by logging out of the app or disabling location
                        permissions in your device settings. However, this will prevent you from receiving
                        and completing ride assignments.
                    </Typography>

                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                        Payment Information
                    </Typography>
                    <Typography paragraph>
                        Payment processing is handled by Square, Inc., a third-party payment processor.
                        We do not store your complete credit card numbers on our servers. Square's privacy
                        policy governs the collection and use of payment information. Visit{' '}
                        <a href="https://squareup.com/legal/privacy" target="_blank" rel="noopener noreferrer">
                            Square's Privacy Policy
                        </a>{' '}
                        for more details.
                    </Typography>

                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                        Automatically Collected Information
                    </Typography>
                    <Typography paragraph>
                        When you use our services, we may automatically collect:
                    </Typography>
                    <List dense>
                        <ListItem>
                            <ListItemText primary="Device information (device type, operating system, unique device identifiers)" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Log data (access times, pages viewed, app crashes)" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Push notification tokens (for sending ride alerts)" />
                        </ListItem>
                    </List>

                    {/* How We Use Your Information */}
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mt: 4 }}>
                        How We Use Your Information
                    </Typography>
                    <Typography paragraph>
                        We use the information we collect to:
                    </Typography>
                    <List dense>
                        <ListItem>
                            <ListItemText primary="Provide, operate, and maintain our transportation services" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Process and complete ride transactions" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Send push notifications about new rides, ride updates, and messages" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Communicate with you about your account or our services" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Improve and optimize our services" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Ensure safety and prevent fraud" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Comply with legal obligations" />
                        </ListItem>
                    </List>

                    {/* Third-Party Services */}
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mt: 4 }}>
                        Third-Party Services
                    </Typography>
                    <Typography paragraph>
                        We use the following third-party services that may collect information:
                    </Typography>
                    <List dense>
                        <ListItem>
                            <ListItemText
                                primary="Google Maps"
                                secondary="For mapping, navigation, and address autocomplete services"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Square, Inc."
                                secondary="For payment processing"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Expo / Firebase Cloud Messaging"
                                secondary="For push notifications"
                            />
                        </ListItem>
                    </List>

                    {/* Data Retention */}
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mt: 4 }}>
                        Data Retention
                    </Typography>
                    <Typography paragraph>
                        We retain your personal information for as long as your account is active or as
                        needed to provide you services. Ride history and transaction records are retained
                        for accounting and legal compliance purposes. Location data is retained temporarily
                        for active sessions and is not stored long-term after rides are completed.
                    </Typography>

                    {/* Data Security */}
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mt: 4 }}>
                        Data Security
                    </Typography>
                    <Typography paragraph>
                        We implement appropriate technical and organizational security measures to protect
                        your personal information, including:
                    </Typography>
                    <List dense>
                        <ListItem>
                            <ListItemText primary="Encrypted data transmission (HTTPS/TLS)" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Secure password hashing" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Access controls and authentication" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Regular security updates" />
                        </ListItem>
                    </List>

                    {/* Your Rights */}
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mt: 4 }}>
                        Your Rights
                    </Typography>
                    <Typography paragraph>
                        Depending on your location, you may have the following rights:
                    </Typography>
                    <List dense>
                        <ListItem>
                            <ListItemText primary="Access: Request a copy of your personal data" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Correction: Request correction of inaccurate data" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Deletion: Request deletion of your personal data" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Opt-out: Disable push notifications through your device settings" />
                        </ListItem>
                    </List>
                    <Typography paragraph>
                        To exercise these rights, please contact us at the email address below.
                    </Typography>

                    {/* Children's Privacy */}
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mt: 4 }}>
                        Children's Privacy
                    </Typography>
                    <Typography paragraph>
                        Our services are not intended for individuals under the age of 18. We do not
                        knowingly collect personal information from children. If you believe we have
                        collected information from a child, please contact us immediately.
                    </Typography>

                    {/* Changes to This Policy */}
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mt: 4 }}>
                        Changes to This Privacy Policy
                    </Typography>
                    <Typography paragraph>
                        We may update this Privacy Policy from time to time. We will notify you of any
                        changes by posting the new Privacy Policy on this page and updating the "Last Updated"
                        date. You are advised to review this Privacy Policy periodically for any changes.
                    </Typography>

                    {/* Contact Us */}
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mt: 4 }}>
                        Contact Us
                    </Typography>
                    <Typography paragraph>
                        If you have any questions about this Privacy Policy, please contact us:
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

export default PrivacyPolicy;
