using System;
using System.Threading.Tasks;
using SendGrid;
using SendGrid.Helpers.Mail;
using Microsoft.Extensions.Configuration;

public class EmailService
{
    private readonly string _apiKey;
    private readonly string _fromEmail;
    private readonly string _fromName;

    public EmailService(IConfiguration config)
    {
        _apiKey = config["SendGrid:ApiKey"] 
            ?? throw new InvalidOperationException("SendGrid:ApiKey não definido no appsettings.json");
        _fromEmail = config["SendGrid:FromEmail"] 
            ?? throw new InvalidOperationException("SendGrid:FromEmail não definido no appsettings.json");
        _fromName = config["SendGrid:FromName"] ?? "Meu App";
    }

    public async Task EnviarEmailAsync(string emailDestino, string? nomeDestino, string plainText, string htmlContent)
    {
        var client = new SendGridClient(_apiKey);
        var from = new EmailAddress(_fromEmail, _fromName);
        var to = new EmailAddress(emailDestino, nomeDestino ?? emailDestino);
        var subject = "Recommended Tv Shows for you!!!";

        var msg = MailHelper.CreateSingleEmail(from, to, subject, plainText, htmlContent);
        var response = await client.SendEmailAsync(msg);

        Console.WriteLine($"✅ Email enviado para {emailDestino}, StatusCode: {response.StatusCode}");
    }
}
