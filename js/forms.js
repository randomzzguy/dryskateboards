// Import Supabase client
import { supabaseClient } from './config.js';

// Newsletter Form Handler (Supabase)
document.addEventListener('DOMContentLoaded', function () {
    const newsletterForm = document.getElementById('newsletter-form');
    const newsletterMessage = document.getElementById('newsletter-message');

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('newsletter-email').value;
            const submitButton = newsletterForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;

            // Show loading state
            submitButton.textContent = 'SUBSCRIBING...';
            submitButton.disabled = true;
            newsletterMessage.classList.add('hidden');

            try {
                // Check if email already exists
                const { data: existingSubscriber, error: checkError } = await supabaseClient
                    .from('newsletter_subscribers')
                    .select('email')
                    .eq('email', email)
                    .maybeSingle();

                if (existingSubscriber) {
                    showMessage(newsletterMessage, 'You are already subscribed!', 'info');
                    submitButton.textContent = originalButtonText;
                    submitButton.disabled = false;
                    newsletterForm.reset();
                    return;
                }

                // Insert new subscriber
                const { data, error } = await supabaseClient
                    .from('newsletter_subscribers')
                    .insert([
                        {
                            email: email,
                            subscribed_at: new Date().toISOString()
                        }
                    ]);

                if (error) throw error;

                // Success
                showMessage(newsletterMessage, '🎉 Successfully subscribed! Check your email for your 10% discount code.', 'success');
                newsletterForm.reset();

            } catch (error) {
                console.error('Newsletter subscription error:', error);
                showMessage(newsletterMessage, 'Oops! Something went wrong. Please try again.', 'error');
            } finally {
                submitButton.textContent = originalButtonText;
                submitButton.disabled = false;
            }
        });
    }

    // Contact Form Handler (Web3Forms)
    const contactForm = document.getElementById('contact-form');
    const contactMessageStatus = document.getElementById('contact-message-status');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitButton = document.getElementById('contact-submit-btn');
            const originalButtonText = submitButton.textContent;

            // Show loading state
            submitButton.textContent = 'SENDING...';
            submitButton.disabled = true;
            contactMessageStatus.classList.add('hidden');

            try {
                const formData = new FormData(contactForm);
                const object = Object.fromEntries(formData);
                const json = JSON.stringify(object);

                const response = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: json
                });

                const result = await response.json();

                if (result.success) {
                    showMessage(contactMessageStatus, '✅ Message sent successfully! We\'ll get back to you soon.', 'success');
                    contactForm.reset();
                } else {
                    throw new Error(result.message || 'Form submission failed');
                }

            } catch (error) {
                console.error('Contact form error:', error);
                showMessage(contactMessageStatus, '❌ Failed to send message. Please try again or email us directly.', 'error');
            } finally {
                submitButton.textContent = originalButtonText;
                submitButton.disabled = false;
            }
        });
    }

    // Helper function to show messages
    function showMessage(element, message, type) {
        element.textContent = message;
        element.classList.remove('hidden', 'text-green-600', 'text-red-600', 'text-blue-600');

        if (type === 'success') {
            element.classList.add('text-green-600');
        } else if (type === 'error') {
            element.classList.add('text-red-600');
        } else if (type === 'info') {
            element.classList.add('text-blue-600');
        }

        // Auto-hide after 5 seconds
        setTimeout(() => {
            element.classList.add('hidden');
        }, 5000);
    }
});
